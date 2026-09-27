import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.core.lab_parameters import CKDStage


class ParameterValueType(str, enum.Enum):
    FLOAT = "float"
    INT = "int"


class ParameterScale(str, enum.Enum):
    LINEAR = "linear"
    LOG = "log"


class LabParameter(Base):
    """Single source of truth for a lab parameter: how to chart it, its
    normal range, and its display text in both languages. Replaces the old
    PARAMETER_VALUE_TYPES / PARAMETER_DISPLAY_META dicts in lab_parameters.py.
    """

    __tablename__ = "parameters"

    key = Column(String(50), primary_key=True)  # e.g. "egfr" — matches the LabResult column name
    display_order = Column(Integer, nullable=False)

    value_type = Column(Enum(ParameterValueType, name="parameter_value_type_enum"), nullable=False)
    unit = Column(String(30), nullable=False, default="")

    label_en = Column(String(100), nullable=False)
    label_mk = Column(String(100), nullable=False)
    category_en = Column(String(50), nullable=False)
    category_mk = Column(String(50), nullable=False)

    normal_range_low = Column(Numeric(7, 2), nullable=True)
    normal_range_high = Column(Numeric(7, 2), nullable=True)
    reference_mk = Column(String(30), nullable=True)  # short hint shown on the entry form, e.g. "≥ 60"

    scale = Column(Enum(ParameterScale, name="parameter_scale_enum"), nullable=False, default=ParameterScale.LINEAR)
    decimals = Column(Integer, nullable=False, default=1)
    higher_is_worse = Column(Boolean, nullable=False, default=True)

    stages = relationship("ParameterStage", cascade="all, delete-orphan", backref="parameter")


class ParameterStage(Base):
    """Join table: which CKD stages a given lab parameter is relevant for."""

    __tablename__ = "parameter_stages"

    parameter_key = Column(String(50), ForeignKey("parameters.key", ondelete="CASCADE"), primary_key=True)
    stage = Column(Enum(CKDStage, name="ckd_stage_enum"), primary_key=True)