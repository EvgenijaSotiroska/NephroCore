"""default parameters for G3 to G5, and alkaline phosphatase (ALP)

Final default parameters per CKD stage:

  G1, G2    eGFR, creatinine, ACR, systolic BP, diastolic BP      (set by earlier migrations)
  G3a, G3b  the five above + hemoglobin, potassium, bicarbonate, calcium, phosphate,
            PTH, albumin, ALP
  G4        G3 + ferritin, TSAT
  G5        G4 + urea, sodium

Everything else (vitamin D, magnesium, uric acid, LDL, HbA1c, Kt/V, ...) is added from the
"add another parameter" dropdown on the results form.

Also adds the new lab value alkaline_phosphatase (part of the KDIGO CKD-MBD set).
Stored lab values are never changed or deleted.

Revision ID: f1a6d8c3b574
Revises: e9b3c5a1d742
Create Date: 2026-10-19

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f1a6d8c3b574"
down_revision: Union[str, Sequence[str], None] = "e9b3c5a1d742"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CORE = ["egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic"]

G3 = CORE + ["hemoglobin", "potassium", "bicarbonate", "calcium", "phosphate", "pth", "albumin", "alkaline_phosphatase"]
G4 = G3 + ["ferritin", "tsat"]
G5 = G4 + ["urea", "sodium"]

NEW_DEFAULTS = {"G3A": G3, "G3B": G3, "G4": G4, "G5": G5}

# What these stages had before this migration (used by downgrade).
OLD_G3 = CORE + ["phosphate", "calcium", "hemoglobin", "potassium", "sodium", "vitamin_d",
                 "magnesium", "uric_acid", "ldl_cholesterol"]
OLD_G4 = OLD_G3 + ["pth", "bicarbonate"]
OLD_G5 = OLD_G4 + ["urea", "albumin"]

OLD_DEFAULTS = {"G3A": OLD_G3, "G3B": OLD_G3, "G4": OLD_G4, "G5": OLD_G5}

ALP = dict(
    key="alkaline_phosphatase", display_order=23, value_type="FLOAT", unit="U/L",
    label_en="Alkaline phosphatase (ALP)", label_mk="Алкална фосфатаза (ALP)",
    category_en="CKD-MBD", category_mk="Коскено-минерален метаболизам",
    normal_range_low=40, normal_range_high=130, reference_mk="40–130",
    scale="LINEAR", decimals=0, higher_is_worse=True,
)


def _replace_stage_defaults(defaults: dict[str, list[str]]) -> None:
    stages_table = sa.table(
        "parameter_stages",
        sa.column("parameter_key", sa.String),
        sa.column("stage", postgresql.ENUM("G1", "G2", "G3A", "G3B", "G4", "G5",
                                           name="ckd_stage_enum", create_type=False)),
    )
    op.execute("DELETE FROM parameter_stages WHERE stage IN ('G3A', 'G3B', 'G4', 'G5')")
    op.bulk_insert(stages_table, [
        {"parameter_key": key, "stage": stage}
        for stage, keys in defaults.items()
        for key in keys
    ])


def upgrade() -> None:
    op.add_column("lab_results", sa.Column("alkaline_phosphatase", sa.Numeric(precision=6, scale=1), nullable=True))

    parameters_table = sa.table(
        "parameters",
        sa.column("key", sa.String),
        sa.column("display_order", sa.Integer),
        sa.column("value_type", postgresql.ENUM("FLOAT", "INT", name="parameter_value_type_enum", create_type=False)),
        sa.column("unit", sa.String),
        sa.column("label_en", sa.String),
        sa.column("label_mk", sa.String),
        sa.column("category_en", sa.String),
        sa.column("category_mk", sa.String),
        sa.column("normal_range_low", sa.Numeric),
        sa.column("normal_range_high", sa.Numeric),
        sa.column("reference_mk", sa.String),
        sa.column("scale", postgresql.ENUM("LINEAR", "LOG", name="parameter_scale_enum", create_type=False)),
        sa.column("decimals", sa.Integer),
        sa.column("higher_is_worse", sa.Boolean),
    )
    op.bulk_insert(parameters_table, [ALP])

    _replace_stage_defaults(NEW_DEFAULTS)


def downgrade() -> None:
    _replace_stage_defaults(OLD_DEFAULTS)
    op.execute("DELETE FROM parameters WHERE key = 'alkaline_phosphatase'")
    op.drop_column("lab_results", "alkaline_phosphatase")
