"""doctor_id columns reference doctor_profiles, not users

visits.doctor_id, appointments.doctor_id and medications.doctor_id used to store the
doctor's users.id directly. They now store doctor_profiles.id instead, matching how
patient_id already points at patient_profiles.id rather than users.id. This only
changes what the column points at (an attribution/record-keeping field); access control
still goes entirely through patient_profiles.created_by_doctor_id (see deps.py), so this
does not change who can see what.

ai_analyses.author_id is left alone: it is shared between doctor-authored analyses and
patient-authored explanations, and the latter have no doctor_profiles row to point to.

Revision ID: f3a7c92b5e81
Revises: e6b1d3a8f402
Create Date: 2026-11-08

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3a7c92b5e81"
down_revision: Union[str, Sequence[str], None] = "e6b1d3a8f402"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TABLES = [
    ("visits", "visits_doctor_id_fkey", None),
    ("appointments", "appointments_doctor_id_fkey", "CASCADE"),
    ("medications", "medications_doctor_id_fkey", "CASCADE"),
]


def upgrade() -> None:
    for table, fkey_name, ondelete in _TABLES:
        op.drop_constraint(fkey_name, table, type_="foreignkey")
        op.execute(
            f"UPDATE {table} SET doctor_id = dp.id "
            f"FROM doctor_profiles dp WHERE dp.user_id = {table}.doctor_id"
        )
        op.create_foreign_key(
            fkey_name, table, "doctor_profiles", ["doctor_id"], ["id"], ondelete=ondelete
        )


def downgrade() -> None:
    for table, fkey_name, ondelete in _TABLES:
        op.drop_constraint(fkey_name, table, type_="foreignkey")
        op.execute(
            f"UPDATE {table} SET doctor_id = dp.user_id "
            f"FROM doctor_profiles dp WHERE dp.id = {table}.doctor_id"
        )
        op.create_foreign_key(
            fkey_name, table, "users", ["doctor_id"], ["id"], ondelete=ondelete
        )
