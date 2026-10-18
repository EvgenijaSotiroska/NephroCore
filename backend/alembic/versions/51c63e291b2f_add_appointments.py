"""add appointments

Revision ID: 51c63e291b2f
Revises: e5a19f7c3d02
Create Date: 2026-09-29

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "51c63e291b2f"
down_revision: Union[str, Sequence[str], None] = "e5a19f7c3d02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    appointment_status_enum = postgresql.ENUM(
        "scheduled",
        "completed",
        "cancelled",
        "no_show",
        name="appointment_status_enum",
        create_type=False,  # created explicitly below; create_table must not create it a second time
    )

    appointment_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "appointments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "doctor_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "patient_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "scheduled_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "duration_minutes",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "appointment_type",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "status",
            appointment_status_enum,
            nullable=False,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
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
        sa.ForeignKeyConstraint(
            ["doctor_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patient_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_appointments_doctor_id",
        "appointments",
        ["doctor_id"],
        unique=False,
    )

    op.create_index(
        "ix_appointments_patient_id",
        "appointments",
        ["patient_id"],
        unique=False,
    )

    op.create_index(
        "ix_appointments_scheduled_at",
        "appointments",
        ["scheduled_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_appointments_scheduled_at",
        table_name="appointments",
    )

    op.drop_index(
        "ix_appointments_patient_id",
        table_name="appointments",
    )

    op.drop_index(
        "ix_appointments_doctor_id",
        table_name="appointments",
    )

    op.drop_table("appointments")

    appointment_status_enum = postgresql.ENUM(
        "scheduled",
        "completed",
        "cancelled",
        "no_show",
        name="appointment_status_enum",
    )

    appointment_status_enum.drop(op.get_bind(), checkfirst=True)