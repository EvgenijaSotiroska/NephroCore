from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    patient_id: UUID
    scheduled_at: datetime
    duration_minutes: int = Field(default=30, ge=5, le=240)
    appointment_type: str | None = None
    notes: str | None = None


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
