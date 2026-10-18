from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.symptom import SymptomIntensity


class SymptomCreate(BaseModel):
    patient_id: UUID | None = None  
    symptom_date: date
    description: str = Field(min_length=1)
    intensity: SymptomIntensity


class SymptomUpdate(BaseModel):
    symptom_date: date | None = None
    description: str | None = Field(default=None, min_length=1)
    intensity: SymptomIntensity | None = None


class SymptomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID

    symptom_date: date
    description: str
    intensity: SymptomIntensity

    created_at: datetime
    updated_at: datetime