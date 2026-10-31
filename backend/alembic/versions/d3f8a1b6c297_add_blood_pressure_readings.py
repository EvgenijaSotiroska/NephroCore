"""add blood pressure readings

Home blood pressure measurements entered by the patient (a diary). The clinic readings stay with
the visits.

Revision ID: d3f8a1b6c297
Revises: c7e2a9d4f185
Create Date: 2026-11-03

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "d3f8a1b6c297"
down_revision: Union[str, Sequence[str], None] = "c7e2a9d4f185"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "blood_pressure_readings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reading_date", sa.Date(), nullable=False),
        sa.Column("systolic", sa.Integer(), nullable=False),
        sa.Column("diastolic", sa.Integer(), nullable=False),
        sa.Column("pulse", sa.Integer(), nullable=True),
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
        sa.ForeignKeyConstraint(["patient_id"], ["patient_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_blood_pressure_readings_patient_id", "blood_pressure_readings", ["patient_id"]
    )
    op.create_index(
        "ix_blood_pressure_readings_reading_date", "blood_pressure_readings", ["reading_date"]
    )


def downgrade() -> None:
    op.drop_index("ix_blood_pressure_readings_reading_date", table_name="blood_pressure_readings")
    op.drop_index("ix_blood_pressure_readings_patient_id", table_name="blood_pressure_readings")
    op.drop_table("blood_pressure_readings")
