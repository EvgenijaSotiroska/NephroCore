from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator


def _normalize_times(values: list[time]) -> list[time]:
    """Drop seconds, remove duplicates, sort."""
    return sorted({t.replace(second=0, microsecond=0, tzinfo=None) for t in values})


class MedicationCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    patient_id: UUID
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    dose: str = Field(min_length=1, max_length=100)
    times: list[time] = Field(min_length=1, max_length=12)
    is_active: bool = True

    @field_validator("times")
    @classmethod
    def normalize_times(cls, values: list[time]) -> list[time]:
        return _normalize_times(values)


class MedicationUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    dose: str | None = Field(default=None, min_length=1, max_length=100)
    times: list[time] | None = Field(default=None, min_length=1, max_length=12)
    is_active: bool | None = None

    @field_validator("times")
    @classmethod
    def normalize_times(cls, values: list[time] | None) -> list[time] | None:
        return _normalize_times(values) if values is not None else None


class MedicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doctor_id: UUID
    patient_id: UUID

    name: str
    description: str | None
    dose: str
    times: list[time]
    is_active: bool

    created_at: datetime
    updated_at: datetime

    @field_serializer("times")
    def serialize_times(self, values: list[time]) -> list[str]:
        return [t.strftime("%H:%M") for t in values]