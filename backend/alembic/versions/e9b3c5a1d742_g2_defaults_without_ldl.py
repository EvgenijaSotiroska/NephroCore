"""G2 default parameters: same as G1 (remove LDL cholesterol)

G1 and G2 share one early-CKD panel: eGFR, creatinine, ACR and the two blood pressure
values. LDL (and anything else) can still be added from the "add another parameter"
dropdown on the results form.

Only the stage list changes; no lab values are touched.

Revision ID: e9b3c5a1d742
Revises: c4e8a2d7f913
Create Date: 2026-10-19

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e9b3c5a1d742"
down_revision: Union[str, Sequence[str], None] = "c4e8a2d7f913"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "DELETE FROM parameter_stages WHERE parameter_key = 'ldl_cholesterol' AND stage = 'G2'"
    )


def downgrade() -> None:
    op.execute(
        "INSERT INTO parameter_stages (parameter_key, stage) VALUES ('ldl_cholesterol', 'G2') "
        "ON CONFLICT DO NOTHING"
    )
