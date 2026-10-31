"""remove pulse from blood pressure readings

The diary only records the two blood pressure values.

Revision ID: e6b1d3a8f402
Revises: d3f8a1b6c297
Create Date: 2026-11-04

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e6b1d3a8f402"
down_revision: Union[str, Sequence[str], None] = "d3f8a1b6c297"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("blood_pressure_readings", "pulse")


def downgrade() -> None:
    # The column comes back empty: the deleted pulse values cannot be restored.
    op.add_column(
        "blood_pressure_readings",
        sa.Column("pulse", sa.Integer(), nullable=True),
    )
