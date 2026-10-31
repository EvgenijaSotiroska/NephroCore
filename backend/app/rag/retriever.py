from dataclasses import dataclass

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document_chunk import DocumentChunk

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_TIMEOUT_SECONDS = 20


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    document_id: str
    page_number: int | None  # page in the PDF file
    pdf_page_label: str | None  # printed page number (only stored for figures and tables)
    element_title: str | None

RECOMMENDATION_MARKERS = ("Recommendation", "Practice Point")
RECOMMENDATION_BONUS = 0.05  # taken off the cosine distance
CANDIDATES_PER_QUERY = 8


def embed_queries(texts: list[str]) -> list[list[float]]:
    """Embed all queries in one request; the vectors come back in the order of `texts`."""
    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=EMBEDDING_TIMEOUT_SECONDS,
        max_retries=1,
    )
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in sorted(response.data, key=lambda item: item.index)]


def _ranked_candidates(db: Session, query_embedding: list[float]) -> list[DocumentChunk]:
    """The closest passages for one query, with recommendations moved up a little."""
    distance = DocumentChunk.embedding.cosine_distance(query_embedding)
    rows = db.execute(
        select(DocumentChunk, distance.label("distance"))
        .order_by(distance)
        .limit(CANDIDATES_PER_QUERY)
    ).all()

    def adjusted(row) -> float:
        chunk, chunk_distance = row
        states_recommendation = any(marker in chunk.text for marker in RECOMMENDATION_MARKERS)
        return chunk_distance - (RECOMMENDATION_BONUS if states_recommendation else 0)

    return [chunk for chunk, _ in sorted(rows, key=adjusted)]


def retrieve_chunks_for_queries(
    db: Session, queries: list[str], per_query: int = 2, max_total: int = 12
) -> list[RetrievedChunk]:
    """Search the guidelines once per query and combine the results, searched across all documents.

    Every query gets its best passage first, then its second best, and so on, so that no topic is cut
    off when there are many queries. A passage found by several queries is returned once.
    """
    ranked_per_query = [
        _ranked_candidates(db, embedding) for embedding in embed_queries(queries)
    ]

    picked: list[RetrievedChunk] = []
    seen: set[str] = set()
    for _ in range(per_query):
        for candidates in ranked_per_query:
            while candidates:
                chunk = candidates.pop(0)
                if chunk.chunk_id in seen:
                    continue
                seen.add(chunk.chunk_id)
                picked.append(
                    RetrievedChunk(
                        text=chunk.text,
                        document_id=chunk.document_id,
                        page_number=chunk.page_number,
                        pdf_page_label=chunk.pdf_page_label,
                        element_title=chunk.element_title,
                    )
                )
                break
            if len(picked) >= max_total:
                return picked
    return picked
