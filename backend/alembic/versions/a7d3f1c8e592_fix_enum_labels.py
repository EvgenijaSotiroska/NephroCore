"""fix enum labels so the database accepts what the models send

SQLAlchemy sends the NAME of an enum member (CKDEtiology.NONE -> 'NONE',
AppointmentStatus.SCHEDULED -> 'SCHEDULED'). Two older migrations created the labels
in lowercase, so a database built only from migrations rejected those values:

  * ckd_etiology_enum:      migration d92f4c81a6e3 added 'none'; the model sends 'NONE'
  * appointment_status_enum: migration 51c63e291b2f created 'scheduled', 'completed', ...

Safe on every database: nothing happens where the labels are already correct.

Revision ID: a7d3f1c8e592
Revises: 8c1e5b7a2d46
Create Date: 2026-10-18

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a7d3f1c8e592"
down_revision: Union[str, Sequence[str], None] = "8c1e5b7a2d46"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

APPOINTMENT_LABELS = [
    ("scheduled", "SCHEDULED"),
    ("completed", "COMPLETED"),
    ("cancelled", "CANCELLED"),
    ("no_show", "NO_SHOW"),
]


def upgrade() -> None:
    # A new enum value cannot be used in the same transaction that adds it.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE ckd_etiology_enum ADD VALUE IF NOT EXISTS 'NONE'")

    for old, new in APPOINTMENT_LABELS:
        op.execute(
            f"""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'appointment_status_enum' AND e.enumlabel = '{old}'
                ) THEN
                    ALTER TYPE appointment_status_enum RENAME VALUE '{old}' TO '{new}';
                END IF;
            END $$;
            """
        )


def downgrade() -> None:
    # These are corrections. Putting the wrong labels back would break the app again,
    # and PostgreSQL cannot remove an enum value, so there is nothing to undo.
    pass
