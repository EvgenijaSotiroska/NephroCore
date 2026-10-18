from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.patient_profile import (
    CKDEtiology,
    DialysisModality,
    DialysisStatus,
    Sex,
)


class PatientCreateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)

    # Demographics
    date_of_birth: date | None = None
    sex: Sex
    height_cm: Decimal | None = Field(default=None, ge=0, le=300)  # column is NUMERIC(5, 1)

    # Clinical history
    previous_conditions: str | None = None
    genetic_risk_factors: str | None = None
    comorbidities: str | None = None
    current_medications: str | None = None
    smoking: bool | None = None

    # CKD-specific
    ckd_etiology: CKDEtiology | None = None
    diagnosis_date: date | None = None
    baseline_egfr: Decimal | None = Field(default=None, ge=0, le=999.99)  # column is NUMERIC(5, 2)

    dialysis_status: DialysisStatus = DialysisStatus.PRE_DIALYSIS
    dialysis_modality: DialysisModality | None = None


class PatientStatusUpdate(BaseModel):
    # True: currently followed. False: kept on record (e.g. switched doctor).
    is_active: bool


class PatientCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    invite_code: str
    invite_code_expires_at: datetime


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str

    # Demographics
    date_of_birth: date | None
    sex: Sex
    height_cm: Decimal | None

    # Clinical history
    previous_conditions: str | None
    genetic_risk_factors: str | None
    comorbidities: str | None
    current_medications: str | None
    smoking: bool | None

    # CKD-specific
    ckd_etiology: CKDEtiology | None
    diagnosis_date: date | None
    baseline_egfr: Decimal | None

    dialysis_status: DialysisStatus
    dialysis_modality: DialysisModality | None

    is_activated: bool
    is_active: bool