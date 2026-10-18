from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import CLINIC_TZ
from app.models.appointment import AppointmentStatus


def _as_clinic_time(value: datetime | None) -> datetime | None:
    """A time sent without a timezone is read as clinic (Skopje) time."""
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=CLINIC_TZ)
    return value


class AppointmentCreate(BaseModel):
    patient_id: UUID
    scheduled_at: datetime
    duration_minutes: int = Field(default=30, ge=5, le=240)
    appointment_type: str | None = None
    notes: str | None = None

    @field_validator("scheduled_at")
    @classmethod
    def read_as_clinic_time(cls, value: datetime) -> datetime:
        return _as_clinic_time(value)


class AppointmentUpdate(BaseModel):
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(
        default=None,
        ge=5,
        le=240,
    )
    appointment_type: str | None = None
    status: AppointmentStatus | None = None
    notes: str | None = None

    @field_validator("scheduled_at")
    @classmethod
    def read_as_clinic_time(cls, value: datetime | None) -> datetime | None:
        return _as_clinic_time(value)


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doctor_id: UUID
    patient_id: UUID

    scheduled_at: datetime
    duration_minutes: int

    appointment_type: str | None
    status: AppointmentStatus
    notes: str | None

    created_at: datetime
    updated_at: datetime
