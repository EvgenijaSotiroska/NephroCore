"""remove genetic risk factors and the obesity and dyslipidemia comorbidities

The nephrologist found the genetic risk factors useless, and obesity and dyslipidemia are no longer
choices in the comorbidities list. Existing rows lose those two codes so they do not show up in the
profile or reach the AI.

Revision ID: c7e2a9d4f185
Revises: b2d9e4f7a136
Create Date: 2026-11-02

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c7e2a9d4f185"
down_revision: Union[str, Sequence[str], None] = "b2d9e4f7a136"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Comorbidities are stored as codes joined with "|" (for example "hypertension|obesity").
    op.execute(
        """
        UPDATE patient_profiles
        SET comorbidities = NULLIF(
            array_to_string(
                array_remove(
                    array_remove(string_to_array(comorbidities, '|'), 'obesity'),
                    'dyslipidemia'
                ),
                '|'
            ),
            ''
        )
        WHERE comorbidities LIKE '%obesity%' OR comorbidities LIKE '%dyslipidemia%'
        """
    )
    op.drop_column("patient_profiles", "genetic_risk_factors")


def downgrade() -> None:
    # The column comes back empty: the deleted genetics data and comorbidity codes cannot be restored.
    op.add_column(
        "patient_profiles",
        sa.Column("genetic_risk_factors", sa.Text(), nullable=True),
    )
