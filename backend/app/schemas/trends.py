import datetime
import uuid
from typing import Optional

from pydantic import BaseModel


class TrendPoint(BaseModel):
    visit_id: uuid.UUID
    date: datetime.date
    value: float
    ckd_stage: str


class ParameterTrend(BaseModel):
    key: str
    label: str
    unit: str
    category: str
    scale: str
    decimals: int
    normal_range_low: Optional[float] = None
    normal_range_high: Optional[float] = None
    higher_is_worse: bool
    points: list[TrendPoint]
    # simple linear regression slope over the returned points, in units/year
    slope_per_year: Optional[float] = None
    latest_value: Optional[float] = None
    latest_date: Optional[datetime.date] = None
    is_out_of_range: bool = False


class PatientTrendsResponse(BaseModel):
    patient_id: uuid.UUID
    current_ckd_stage: Optional[str] = None
    parameters: list[ParameterTrend]