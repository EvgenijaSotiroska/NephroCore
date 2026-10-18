"""initial users, doctor_profiles and patient_profiles

Baseline for a fresh database. These three tables used to be created by
Base.metadata.create_all(), so no migration built them. This revision creates
them in the shape they had BEFORE the first older migration (33e11c099592);
the migrations after it then bring them to the current models.

Databases that already exist are not affected: Alembic only looks at the
revision stored in their alembic_version table.

Revision ID: 2f8a6c1d9e30
Revises:
Create Date: 2026-10-18

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "2f8a6c1d9e30"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("role", sa.Enum("doctor", "patient", name="userrole"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "doctor_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("hospital", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # Columns that later migrations drop or change are included on purpose:
    # allergies, alcohol, smoking and the two JSON columns.
    op.create_table(
        "patient_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("previous_conditions", sa.Text(), nullable=True),
        sa.Column("genetic_risk_factors", sa.Text(), nullable=True),
        sa.Column("comorbidities", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("allergies", sa.Text(), nullable=True),
        sa.Column("current_medications", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("smoking", sa.Boolean(), nullable=True),
        sa.Column("alcohol", sa.Boolean(), nullable=True),
        sa.Column("invite_code", sa.String(length=20), nullable=True),
        sa.Column("invite_code_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_activated", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["created_by_doctor_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_patient_profiles_invite_code"), "patient_profiles", ["invite_code"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_patient_profiles_invite_code"), table_name="patient_profiles")
    op.drop_table("patient_profiles")
    op.drop_table("doctor_profiles")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
