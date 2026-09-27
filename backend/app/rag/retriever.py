from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document_chunk import DocumentChunk

EMBEDDING_MODEL = "text-embedding-3-small"


def embed_query(text: str) -> list[float]:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=[text])
    return response.data[0].embedding


def retrieve_relevant_chunks(db: Session, query: str, top_k: int = 5) -> list[str]:
    """Embed `query` and return the `top_k` most similar guideline chunk
    texts, searched across all documents — no document-level filtering."""
    query_embedding = embed_query(query)
    rows = (
        db.query(DocumentChunk)
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
        .all()
    )
    return [row.text for row in rows]