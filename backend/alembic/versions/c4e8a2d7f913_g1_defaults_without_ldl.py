"""G1 default parameters: remove LDL cholesterol

For CKD stage G1 the default parameters are eGFR, creatinine, ACR and the two blood
pressure values. LDL (and anything else) can still be added from the "add another
parameter" dropdown on the results form.

Only the stage list changes; no lab values are touched.

Revision ID: c4e8a2d7f913
Revises: a7d3f1c8e592
Create Date: 2026-10-19

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c4e8a2d7f913"
down_revision: Union[str, Sequence[str], None] = "a7d3f1c8e592"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "DELETE FROM parameter_stages WHERE parameter_key = 'ldl_cholesterol' AND stage = 'G1'"
    )


def downgrade() -> None:
    op.execute(
        "INSERT INTO parameter_stages (parameter_key, stage) VALUES ('ldl_cholesterol', 'G1') "
        "ON CONFLICT DO NOTHING"
    )
