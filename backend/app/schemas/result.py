import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.result import CKDStage


class ParameterDefinition(BaseModel):
    key: str
    value_type: str
    label_mk: str
    unit: str
    reference_mk: str

class StageParametersResponse(BaseModel):
    stage: CKDStage
    parameters: list[ParameterDefinition]

class LabResultBase(BaseModel):
    # Every "le" is the largest value the matching NUMERIC(precision, scale) column can hold.
    egfr: float | None = Field(default=None, ge=0, le=999.99)
    creatinine: float | None = Field(default=None, ge=0, le=9999.99)
    acr: float | None = Field(default=None, ge=0, le=99999.99)
    bp_systolic: int | None = Field(default=None, ge=0, le=400)
    bp_diastolic: int | None = Field(default=None, ge=0, le=400)
    phosphate: float | None = Field(default=None, ge=0, le=99.99)
    calcium: float | None = Field(default=None, ge=0, le=99.99)
    hemoglobin: float | None = Field(default=None, ge=0, le=999.99)
    potassium: float | None = Field(default=None, ge=0, le=99.99)
    pth: float | None = Field(default=None, ge=0, le=9999.99)
    bicarbonate: float | None = Field(default=None, ge=0, le=99.99)
    urea: float | None = Field(default=None, ge=0, le=999.99)
    albumin: float | None = Field(default=None, ge=0, le=999.99)
    sodium: float | None = Field(default=None, ge=0, le=999.9)
    ferritin: float | None = Field(default=None, ge=0, le=99999.9)
    tsat: float | None = Field(default=None, ge=0, le=999.9)
    vitamin_d: float | None = Field(default=None, ge=0, le=9999.9)
    magnesium: float | None = Field(default=None, ge=0, le=99.99)
    uric_acid: float | None = Field(default=None, ge=0, le=9999.9)
    hba1c: float | None = Field(default=None, ge=0, le=999.9)
    ldl_cholesterol: float | None = Field(default=None, ge=0, le=99.99)
    kt_v: float | None = Field(default=None, ge=0, le=99.99)


class LabResultResponse(LabResultBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class VisitCreate(BaseModel):
    patient_id: uuid.UUID
    visit_date: date
    ckd_stage: CKDStage
    notes: str | None = None
    lab_result: LabResultBase


class VisitUpdate(BaseModel):
    visit_date: date | None = None
    ckd_stage: CKDStage | None = None
    notes: str | None = None  # send null to clear the notes
    lab_result: LabResultBase | None = None

    @field_validator("visit_date", "ckd_stage")
    @classmethod
    def must_not_be_null(cls, value):
        # Only runs when the field is sent; leaving it out keeps the current value.
        if value is None:
            raise ValueError("This field cannot be null.")
        return value


class VisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    visit_date: date
    ckd_stage: CKDStage
    notes: str | None = None
    created_at: datetime
    lab_result: LabResultResponse | None = None


class VisitListResponse(BaseModel):
    visits: list[VisitResponse]
    total: int
