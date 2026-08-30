from datetime import date, datetime

from pydantic import BaseModel


class PatientCreateRequest(BaseModel):
    full_name: str
    date_of_birth: date | None = None
    previous_conditions: str | None = None
    genetic_risk_factors: str | None = None
    comorbidities: dict | None = None
    current_medications: list[dict] | None = None
    allergies: str | None = None
    smoking: bool | None = None
    alcohol: bool | None = None


class PatientCreateResponse(BaseModel):
    id: str
    full_name: str
    invite_code: str
    invite_code_expires_at: datetime

    class Config:
        from_attributes = True


class PatientOut(BaseModel):
    id: str
    full_name: str
    date_of_birth: date | None
    previous_conditions: str | None
    genetic_risk_factors: str | None
    comorbidities: dict | None
    current_medications: list[dict] | None
    allergies: str | None
    smoking: bool | None
    alcohol: bool | None
    is_activated: bool

    class Config:
        from_attributes = True
