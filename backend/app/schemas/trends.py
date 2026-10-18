import datetime
import uuid

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
    normal_range_low: float | None = None
    normal_range_high: float | None = None
    higher_is_worse: bool
    points: list[TrendPoint]
    # simple linear regression slope over the returned points, in units/year
    slope_per_year: float | None = None
    latest_value: float | None = None
    latest_date: datetime.date | None = None
    is_out_of_range: bool = False
    is_default: bool = True


class PatientTrendsResponse(BaseModel):
    patient_id: uuid.UUID
    current_ckd_stage: str | None = None
    parameters: list[ParameterTrend]
