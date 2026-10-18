"""add extended lab parameters (sodium, ferritin, tsat, vitamin d, magnesium, uric acid, hba1c, ldl cholesterol, kt/v)

Revision ID: e5a19f7c3d02
Revises: d92f4c81a6e3
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'e5a19f7c3d02'
down_revision: Union[str, Sequence[str], None] = 'd92f4c81a6e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NEW_PARAMETERS = [
    dict(key="sodium", display_order=14, value_type="FLOAT", unit="mmol/L",
         label_en="Sodium", label_mk="Натриум",
         category_en="Electrolytes", category_mk="Електролити",
         normal_range_low=135, normal_range_high=145, reference_mk="135–145",
         scale="LINEAR", decimals=0, higher_is_worse=True),
    dict(key="ferritin", display_order=15, value_type="FLOAT", unit="ng/mL",
         label_en="Ferritin", label_mk="Феритин",
         category_en="Anemia", category_mk="Анемија",
         normal_range_low=100, normal_range_high=300, reference_mk="30–300 (за бубрежни > 100)",
         scale="LINEAR", decimals=0, higher_is_worse=False),
    dict(key="tsat", display_order=16, value_type="FLOAT", unit="%",
         label_en="Transferrin saturation (TSAT)", label_mk="Сатурација на трансферин (TSAT)",
         category_en="Anemia", category_mk="Анемија",
         normal_range_low=20, normal_range_high=50, reference_mk="20–50%",
         scale="LINEAR", decimals=0, higher_is_worse=False),
    dict(key="vitamin_d", display_order=17, value_type="FLOAT", unit="ng/mL",
         label_en="Vitamin D (25-OH)", label_mk="Витамин Д (25-ОХ)",
         category_en="CKD-MBD", category_mk="Коскено-минерален метаболизам",
         normal_range_low=30, normal_range_high=100, reference_mk="30–100",
         scale="LINEAR", decimals=0, higher_is_worse=False),
    dict(key="magnesium", display_order=18, value_type="FLOAT", unit="mmol/L",
         label_en="Magnesium", label_mk="Магнезиум",
         category_en="Electrolytes", category_mk="Електролити",
         normal_range_low=0.7, normal_range_high=1.0, reference_mk="0.70–1.00",
         scale="LINEAR", decimals=2, higher_is_worse=True),
    dict(key="uric_acid", display_order=19, value_type="FLOAT", unit="µmol/L",
         label_en="Uric acid", label_mk="Мочна киселина",
         category_en="Kidney function", category_mk="Функција на бубрезите",
         normal_range_low=200, normal_range_high=420, reference_mk="200–420",
         scale="LINEAR", decimals=0, higher_is_worse=True),
    dict(key="hba1c", display_order=20, value_type="FLOAT", unit="%",
         label_en="HbA1c", label_mk="HbA1c (гликиран хемоглобин)",
         category_en="Diabetes", category_mk="Дијабетес",
         normal_range_low=4, normal_range_high=7, reference_mk="< 7%",
         scale="LINEAR", decimals=1, higher_is_worse=True),
    dict(key="ldl_cholesterol", display_order=21, value_type="FLOAT", unit="mmol/L",
         label_en="LDL cholesterol", label_mk="LDL холестерол",
         category_en="Lipids", category_mk="Липиди",
         normal_range_low=0, normal_range_high=2.6, reference_mk="< 2.6",
         scale="LINEAR", decimals=1, higher_is_worse=True),
    dict(key="kt_v", display_order=22, value_type="FLOAT", unit="",
         label_en="Kt/V (dialysis adequacy)", label_mk="Kt/V (адекватност на дијализа)",
         category_en="Dialysis adequacy", category_mk="Адекватност на дијализа",
         normal_range_low=1.2, normal_range_high=2.0, reference_mk="≥ 1.2",
         scale="LINEAR", decimals=2, higher_is_worse=False),
]

# Only these get a default stage. ferritin, tsat, hba1c, and kt_v are
# condition-specific workup tests (anemia workup, diabetes, dialysis
# adequacy) that don't fit a "this CKD stage always needs this" rule —
# they're added manually via the entry form's "add another parameter"
# picker instead of auto-appearing by stage.
NEW_PARAMETER_STAGES = {
    "sodium": ["G3A", "G3B", "G4", "G5"],
    "vitamin_d": ["G3A", "G3B", "G4", "G5"],
    "magnesium": ["G3A", "G3B", "G4", "G5"],
    "uric_acid": ["G3A", "G3B", "G4", "G5"],
    "ldl_cholesterol": ["G1", "G2", "G3A", "G3B", "G4", "G5"],
}


def upgrade() -> None:
    op.add_column('lab_results', sa.Column('sodium', sa.Numeric(precision=4, scale=1), nullable=True))
    op.add_column('lab_results', sa.Column('ferritin', sa.Numeric(precision=6, scale=1), nullable=True))
    op.add_column('lab_results', sa.Column('tsat', sa.Numeric(precision=4, scale=1), nullable=True))
    op.add_column('lab_results', sa.Column('vitamin_d', sa.Numeric(precision=5, scale=1), nullable=True))
    op.add_column('lab_results', sa.Column('magnesium', sa.Numeric(precision=4, scale=2), nullable=True))
    op.add_column('lab_results', sa.Column('uric_acid', sa.Numeric(precision=5, scale=1), nullable=True))
    op.add_column('lab_results', sa.Column('hba1c', sa.Numeric(precision=4, scale=1), nullable=True))
    op.add_column('lab_results', sa.Column('ldl_cholesterol', sa.Numeric(precision=4, scale=2), nullable=True))
    op.add_column('lab_results', sa.Column('kt_v', sa.Numeric(precision=4, scale=2), nullable=True))

    parameters_table = sa.table(
        'parameters',
        sa.column('key', sa.String),
        sa.column('display_order', sa.Integer),
        sa.column('value_type', postgresql.ENUM('FLOAT', 'INT', name='parameter_value_type_enum', create_type=False)),
        sa.column('unit', sa.String),
        sa.column('label_en', sa.String),
        sa.column('label_mk', sa.String),
        sa.column('category_en', sa.String),
        sa.column('category_mk', sa.String),
        sa.column('normal_range_low', sa.Numeric),
        sa.column('normal_range_high', sa.Numeric),
        sa.column('reference_mk', sa.String),
        sa.column('scale', postgresql.ENUM('LINEAR', 'LOG', name='parameter_scale_enum', create_type=False)),
        sa.column('decimals', sa.Integer),
        sa.column('higher_is_worse', sa.Boolean),
    )
    op.bulk_insert(parameters_table, NEW_PARAMETERS)

    stages_table = sa.table(
        'parameter_stages',
        sa.column('parameter_key', sa.String),
        sa.column('stage',
                  postgresql.ENUM('G1', 'G2', 'G3A', 'G3B', 'G4', 'G5', name='ckd_stage_enum', create_type=False)),
    )
    op.bulk_insert(stages_table, [
        {"parameter_key": key, "stage": stage}
        for key, stages in NEW_PARAMETER_STAGES.items()
        for stage in stages
    ])


def downgrade() -> None:
    keys = tuple(p["key"] for p in NEW_PARAMETERS)
    op.execute(f"DELETE FROM parameter_stages WHERE parameter_key IN {keys}")
    op.execute(f"DELETE FROM parameters WHERE key IN {keys}")
    for col in ["kt_v", "ldl_cholesterol", "hba1c", "uric_acid", "magnesium", "vitamin_d", "tsat", "ferritin", "sodium"]:
        op.drop_column('lab_results', col)