"""add ai_analyses table

Stores every AI analysis (doctor) and AI explanation (patient) so they can be opened again.

Revision ID: b2d9e4f7a136
Revises: f1a6d8c3b574
Create Date: 2026-10-19

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b2d9e4f7a136"
down_revision: Union[str, Sequence[str], None] = "f1a6d8c3b574"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

kind_enum = postgresql.ENUM("doctor", "patient", name="ai_analysis_kind_enum", create_type=False)


def upgrade() -> None:
    kind_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "ai_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "patient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("patient_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("kind", kind_enum, nullable=False),
        sa.Column("analysis", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_analyses_patient_id", "ai_analyses", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_ai_analyses_patient_id", table_name="ai_analyses")
    op.drop_table("ai_analyses")
    kind_enum.drop(op.get_bind(), checkfirst=True)