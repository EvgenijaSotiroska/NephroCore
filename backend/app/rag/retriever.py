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


def embed_query(text: str) -> list[float]:
    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=EMBEDDING_TIMEOUT_SECONDS,
        max_retries=1,
    )
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=[text])
    return response.data[0].embedding


def retrieve_relevant_chunks(db: Session, query: str, top_k: int = 5) -> list[RetrievedChunk]:
    """Embed `query` and return the `top_k` most similar guideline chunks (with their
    document and page), searched across all documents — no document-level filtering."""
    query_embedding = embed_query(query)
    rows = db.scalars(
        select(DocumentChunk)
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )
    return [
        RetrievedChunk(
            text=row.text,
            document_id=row.document_id,
            page_number=row.page_number,
            pdf_page_label=row.pdf_page_label,
            element_title=row.element_title,
        )
        for row in rows
    ]