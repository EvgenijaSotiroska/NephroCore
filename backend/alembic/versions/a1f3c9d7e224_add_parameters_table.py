"""add parameters and parameter_stages tables

Revision ID: a1f3c9d7e224
Revises: be3fe82a089b
Create Date: 2026-09-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1f3c9d7e224'
down_revision: Union[str, Sequence[str], None] = 'be3fe82a089b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PARAMETERS = [
    dict(key="egfr", display_order=1, value_type="float", unit="mL/min/1.73m2",
         label_en="eGFR", label_mk="eGFR",
         category_en="Kidney function", category_mk="Функција на бубрезите",
         normal_range_low=90, normal_range_high=120, reference_mk="≥ 60",
         scale="linear", decimals=1, higher_is_worse=False),
    dict(key="creatinine", display_order=2, value_type="float", unit="µmol/L",
         label_en="Creatinine", label_mk="Креатинин",
         category_en="Kidney function", category_mk="Функција на бубрезите",
         normal_range_low=60, normal_range_high=110, reference_mk="62–106",
         scale="linear", decimals=1, higher_is_worse=True),
    dict(key="acr", display_order=3, value_type="float", unit="mg/mmol",
         label_en="ACR (albuminuria)", label_mk="ACR (протеини/урина)",
         category_en="Kidney function", category_mk="Функција на бубрезите",
         normal_range_low=0, normal_range_high=3, reference_mk="< 3",
         scale="log", decimals=1, higher_is_worse=True),
    dict(key="bp_systolic", display_order=4, value_type="int", unit="mmHg",
         label_en="Systolic BP", label_mk="Крвен притисок — сист.",
         category_en="Blood pressure", category_mk="Крвен притисок",
         normal_range_low=90, normal_range_high=130, reference_mk="< 140",
         scale="linear", decimals=0, higher_is_worse=True),
    dict(key="bp_diastolic", display_order=5, value_type="int", unit="mmHg",
         label_en="Diastolic BP", label_mk="Крвен притисок — диј.",
         category_en="Blood pressure", category_mk="Крвен притисок",
         normal_range_low=60, normal_range_high=85, reference_mk="< 90",
         scale="linear", decimals=0, higher_is_worse=True),
    dict(key="phosphate", display_order=6, value_type="float", unit="mmol/L",
         label_en="Phosphate", label_mk="Фосфати",
         category_en="CKD-MBD", category_mk="Коскено-минерален метаболизам",
         normal_range_low=0.8, normal_range_high=1.5, reference_mk="0.81–1.45",
         scale="linear", decimals=2, higher_is_worse=True),
    dict(key="calcium", display_order=7, value_type="float", unit="mmol/L",
         label_en="Calcium", label_mk="Калциум",
         category_en="CKD-MBD", category_mk="Коскено-минерален метаболизам",
         normal_range_low=2.1, normal_range_high=2.6, reference_mk="2.10–2.60",
         scale="linear", decimals=2, higher_is_worse=False),
    dict(key="hemoglobin", display_order=8, value_type="float", unit="g/L",
         label_en="Hemoglobin", label_mk="Хемоглобин",
         category_en="Anemia", category_mk="Анемија",
         normal_range_low=120, normal_range_high=160, reference_mk="120–160",
         scale="linear", decimals=1, higher_is_worse=False),
    dict(key="potassium", display_order=9, value_type="float", unit="mmol/L",
         label_en="Potassium", label_mk="Калиум",
         category_en="Electrolytes", category_mk="Електролити",
         normal_range_low=3.5, normal_range_high=5.1, reference_mk="3.5–5.1",
         scale="linear", decimals=2, higher_is_worse=True),
    dict(key="pth", display_order=10, value_type="float", unit="pg/mL",
         label_en="PTH", label_mk="ПТХ (паратхормон)",
         category_en="CKD-MBD", category_mk="Коскено-минерален метаболизам",
         normal_range_low=15, normal_range_high=65, reference_mk="15–65",
         scale="linear", decimals=1, higher_is_worse=True),
    dict(key="bicarbonate", display_order=11, value_type="float", unit="mmol/L",
         label_en="Bicarbonate", label_mk="Бикарбонати (HCO3-)",
         category_en="Electrolytes", category_mk="Електролити",
         normal_range_low=22, normal_range_high=29, reference_mk="22–29",
         scale="linear", decimals=1, higher_is_worse=False),
    dict(key="urea", display_order=12, value_type="float", unit="mmol/L",
         label_en="Urea", label_mk="Уреа",
         category_en="Kidney function", category_mk="Функција на бубрезите",
         normal_range_low=2.5, normal_range_high=7.1, reference_mk="2.5–7.1",
         scale="linear", decimals=1, higher_is_worse=True),
    dict(key="albumin", display_order=13, value_type="float", unit="g/L",
         label_en="Albumin", label_mk="Албумини (серум)",
         category_en="Nutrition", category_mk="Исхрана",
         normal_range_low=35, normal_range_high=50, reference_mk="35–50",
         scale="linear", decimals=1, higher_is_worse=False),
]

# key -> stages it's relevant for, mirrors the old STAGE_PARAMETERS dict
PARAMETER_STAGES = {
    "egfr": ["G1", "G2", "G3A", "G3B", "G4", "G5"],
    "creatinine": ["G1", "G2", "G3A", "G3B", "G4", "G5"],
    "acr": ["G1", "G2", "G3A", "G3B", "G4", "G5"],
    "bp_systolic": ["G1", "G2", "G3A", "G3B", "G4", "G5"],
    "bp_diastolic": ["G1", "G2", "G3A", "G3B", "G4", "G5"],
    "phosphate": ["G3A", "G3B", "G4", "G5"],
    "calcium": ["G3A", "G3B", "G4", "G5"],
    "hemoglobin": ["G3A", "G3B", "G4", "G5"],
    "potassium": ["G3A", "G3B", "G4", "G5"],
    "pth": ["G4", "G5"],
    "bicarbonate": ["G4", "G5"],
    "urea": ["G5"],
    "albumin": ["G5"],
}


def upgrade() -> None:
    op.create_table(
        'parameters',
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('value_type', sa.Enum('FLOAT', 'INT', name='parameter_value_type_enum'), nullable=False),
        sa.Column('unit', sa.String(length=30), nullable=False),
        sa.Column('label_en', sa.String(length=100), nullable=False),
        sa.Column('label_mk', sa.String(length=100), nullable=False),
        sa.Column('category_en', sa.String(length=50), nullable=False),
        sa.Column('category_mk', sa.String(length=50), nullable=False),
        sa.Column('normal_range_low', sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column('normal_range_high', sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column('reference_mk', sa.String(length=30), nullable=True),
        sa.Column('scale', sa.Enum('LINEAR', 'LOG', name='parameter_scale_enum'), nullable=False),
        sa.Column('decimals', sa.Integer(), nullable=False),
        sa.Column('higher_is_worse', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('key'),
    )

    op.create_table(
        'parameter_stages',
        sa.Column('parameter_key', sa.String(length=50), nullable=False),
        sa.Column(
            'stage',
            postgresql.ENUM('G1', 'G2', 'G3A', 'G3B', 'G4', 'G5', name='ckd_stage_enum', create_type=False),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['parameter_key'], ['parameters.key'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('parameter_key', 'stage'),
    )

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
    op.bulk_insert(parameters_table, [
        {**p, "value_type": p["value_type"].upper(), "scale": p["scale"].upper()}
        for p in PARAMETERS
    ])

    stages_table = sa.table(
        'parameter_stages',
        sa.column('parameter_key', sa.String),
        sa.column('stage',
                  postgresql.ENUM('G1', 'G2', 'G3A', 'G3B', 'G4', 'G5', name='ckd_stage_enum', create_type=False)),
    )
    op.bulk_insert(stages_table, [
        {"parameter_key": key, "stage": stage}
        for key, stages in PARAMETER_STAGES.items()
        for stage in stages
    ])


def downgrade() -> None:
    op.drop_table('parameter_stages')
    op.drop_table('parameters')
    op.execute('DROP TYPE parameter_scale_enum')
    op.execute('DROP TYPE parameter_value_type_enum')