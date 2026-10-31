from datetime import date, datetime
from datetime import datetime as _datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.config import CLINIC_TZ


class BloodPressureCreate(BaseModel):
    reading_date: date
    systolic: int = Field(ge=50, le=300)
    diastolic: int = Field(ge=30, le=200)

    @field_validator("reading_date")
    @classmethod
    def not_in_the_future(cls, value: date) -> date:
        if value > _datetime.now(CLINIC_TZ).date():
            raise ValueError("The date cannot be in the future.")
        return value

    @model_validator(mode="after")
    def systolic_above_diastolic(self):
        if self.systolic <= self.diastolic:
            raise ValueError("Systolic pressure must be higher than diastolic pressure.")
        return self


class BloodPressureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID

    reading_date: date
    systolic: int
    diastolic: int

    created_at: datetime
