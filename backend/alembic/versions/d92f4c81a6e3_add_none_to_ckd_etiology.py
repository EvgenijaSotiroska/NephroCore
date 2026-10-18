from typing import Sequence, Union

from alembic import op


revision: str = 'd92f4c81a6e3'
down_revision: Union[str, Sequence[str], None] = 'a1f3c9d7e224'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE ckd_etiology_enum ADD VALUE IF NOT EXISTS 'none'")


def downgrade() -> None:
    # Postgres has no direct "remove enum value" operation — reversing this
    # would require rebuilding the type and remapping any rows using 'none'.
    # Not implemented; if you ever need to roll this back, do it manually.
    pass