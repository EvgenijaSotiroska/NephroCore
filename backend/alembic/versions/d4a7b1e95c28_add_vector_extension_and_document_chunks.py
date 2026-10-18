"""add pgvector extension and document_chunks

The guideline chunks table used to be created by Base.metadata.create_all() at
app startup (and was hidden from Alembic). It now has a migration.

Safe on databases that already have the table: both the extension and the
table are only created when missing.

Revision ID: d4a7b1e95c28
Revises: b4f8d2a61c93
Create Date: 2026-10-18

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = "d4a7b1e95c28"
down_revision: Union[str, Sequence[str], None] = "b4f8d2a61c93"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EMBEDDING_DIM = 1536  # text-embedding-3-small


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "document_chunks",
        sa.Column("chunk_id", sa.String(length=64), nullable=False),
        sa.Column("document_id", sa.String(length=100), nullable=False),
        sa.Column("source_file", sa.String(length=255), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("page_marker", sa.String(length=50), nullable=True),
        sa.Column("chunk_type", sa.String(length=20), nullable=False),
        sa.Column("is_atomic", sa.Boolean(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=True),
        sa.Column("page_chunk_index", sa.Integer(), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("element_number", sa.Integer(), nullable=True),
        sa.Column("element_title", sa.String(length=255), nullable=True),
        sa.Column("pdf_page_label", sa.String(length=50), nullable=True),
        sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=False),
        sa.PrimaryKeyConstraint("chunk_id"),
        if_not_exists=True,
    )
    op.create_index(
        op.f("ix_document_chunks_document_id"),
        "document_chunks",
        ["document_id"],
        unique=False,
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_document_chunks_document_id"), table_name="document_chunks", if_exists=True)
    op.drop_table("document_chunks", if_exists=True)
    # The vector extension is left installed: other objects in the database may use it.
