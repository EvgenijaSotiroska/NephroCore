import json
import re
import sys
import time
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values
from pgvector.psycopg2 import register_vector
from openai import OpenAI, RateLimitError

sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.core.config import settings

BATCH_SIZE = 20
MAX_RETRIES = 6
BASE_BACKOFF_SECONDS = 5
EMBEDDING_MODEL_NAME = "text-embedding-3-small"

JSONL_FILE = Path(__file__).resolve().parent.parent / "data" / "chunks"/ "all_chunks.jsonl"


_client = None


INSERT_SQL = """
INSERT INTO document_chunks (
    chunk_id, document_id, source_file, page_number, page_marker,
    chunk_type, is_atomic, chunk_index, page_chunk_index, token_count,
    text, element_number, element_title, pdf_page_label, embedding
) VALUES %s
ON CONFLICT (chunk_id) DO UPDATE SET
    text = EXCLUDED.text,
    embedding = EXCLUDED.embedding,
    page_number = EXCLUDED.page_number;
"""


def embed_texts(texts):
    """
    Embeds a list of strings via the OpenAI API. Retries with exponential
    backoff on rate-limit errors (tokens-per-minute or requests-per-minute caps).
    Returns a list of float-lists, one per input string, same order as `texts`.
    """
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            sys.exit(
                "Error: OPENAI_API_KEY is not set. Add it to your .env file and make sure "
                "OPENAI_API_KEY is declared as a field on your Settings class in app/core/config.py."
            )
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)

    for attempt in range(MAX_RETRIES):
        try:
            resp = _client.embeddings.create(model=EMBEDDING_MODEL_NAME, input=texts)
            return [d.embedding for d in resp.data]
        except RateLimitError as e:
            if attempt == MAX_RETRIES - 1:
                raise
            wait = BASE_BACKOFF_SECONDS * (2 ** attempt)
            print(
                f"Rate limited, waiting {wait}s before retrying "
                f"(attempt {attempt + 1}/{MAX_RETRIES})... [{e}]",
                file=sys.stderr
            )
            time.sleep(wait)


def load_records(path):
    """Reads the JSONL file line by line and converts each line into a Python dictionary."""
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                yield json.loads(line)


def batched(iterable, n):
    """Groups items into batches of the specified size."""
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) == n:
            yield batch
            batch = []
    if batch:
        yield batch


def main():
    dsn = settings.DATABASE_URL

    if not dsn:
        sys.exit(
            "Error: no database DSN found. Set DATABASE_URL in your .env file."
        )

    dsn = re.sub(r"^postgresql\+\w+://", "postgresql://", dsn)

    conn = psycopg2.connect(dsn)
    register_vector(conn)
    cur = conn.cursor()

    total = 0
    for batch in batched(load_records(JSONL_FILE), BATCH_SIZE):
        texts = [r["text"] for r in batch]
        vectors = embed_texts(texts)

        rows = []
        for r, vec in zip(batch, vectors):
            rows.append(
                (
                    r["chunk_id"], r["document_id"], r.get("source_file"),
                    r.get("page_number"), r.get("page_marker"),
                    r["chunk_type"], r.get("is_atomic", False),
                    r.get("chunk_index"), r.get("page_chunk_index"),
                    r.get("token_count"), r["text"],
                    r.get("element_number"), r.get("element_title"), r.get("pdf_page_label"),
                    vec,
                )
            )

        execute_values(cur, INSERT_SQL, rows)
        conn.commit()
        total += len(rows)

    cur.close()
    conn.close()
    print(f"Done. Loaded {total} chunks total.")


if __name__ == "__main__":
    main()

