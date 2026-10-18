"""add symptoms

Revision ID: 7c2d9e41b5a8
Revises: 51c63e291b2f
Create Date: 2026-10-04

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "7c2d9e41b5a8"
down_revision: Union[str, Sequence[str], None] = "51c63e291b2f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    symptom_intensity_enum = postgresql.ENUM(
        "small",
        "medium",
        "large",
        name="symptom_intensity_enum",
    )
    symptom_intensity_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "symptoms",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("symptom_date", sa.Date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "intensity",
            postgresql.ENUM(
                "small",
                "medium",
                "large",
                name="symptom_intensity_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_id"], ["patient_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_symptoms_doctor_id", "symptoms", ["doctor_id"])
    op.create_index("ix_symptoms_patient_id", "symptoms", ["patient_id"])
    op.create_index("ix_symptoms_symptom_date", "symptoms", ["symptom_date"])


def downgrade() -> None:
    op.drop_index("ix_symptoms_symptom_date", table_name="symptoms")
    op.drop_index("ix_symptoms_patient_id", table_name="symptoms")
    op.drop_index("ix_symptoms_doctor_id", table_name="symptoms")
    op.drop_table("symptoms")

    postgresql.ENUM(name="symptom_intensity_enum").drop(op.get_bind(), checkfirst=True)