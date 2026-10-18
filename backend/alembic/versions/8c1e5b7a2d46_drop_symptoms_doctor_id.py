"""drop symptoms.doctor_id

The patient's doctor is stored once, in patient_profiles.created_by_doctor_id, and every
access check goes through it. symptoms.doctor_id was only a copy of that value.

Revision ID: 8c1e5b7a2d46
Revises: d4a7b1e95c28
Create Date: 2026-10-18

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "8c1e5b7a2d46"
down_revision: Union[str, Sequence[str], None] = "d4a7b1e95c28"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_symptoms_doctor_id", table_name="symptoms")
    op.drop_column("symptoms", "doctor_id")  # also drops its foreign key


def downgrade() -> None:
    op.add_column("symptoms", sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.execute(
        "UPDATE symptoms SET doctor_id = "
        "(SELECT created_by_doctor_id FROM patient_profiles WHERE patient_profiles.id = symptoms.patient_id)"
    )
    op.alter_column("symptoms", "doctor_id", nullable=False)
    op.create_foreign_key(
        "symptoms_doctor_id_fkey", "symptoms", "users", ["doctor_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_symptoms_doctor_id", "symptoms", ["doctor_id"])
