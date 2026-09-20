import uuid
from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

from app.core.lab_parameters import CKDStage


class ParameterDefinition(BaseModel):
    key: str
    value_type: str

class StageParametersResponse(BaseModel):
    stage: CKDStage
    parameters: List[ParameterDefinition]

class LabResultBase(BaseModel):
    egfr: Optional[float] = None
    creatinine: Optional[float] = None
    acr: Optional[float] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    phosphate: Optional[float] = None
    calcium: Optional[float] = None
    hemoglobin: Optional[float] = None
    potassium: Optional[float] = None
    pth: Optional[float] = None
    bicarbonate: Optional[float] = None
    urea: Optional[float] = None
    albumin: Optional[float] = None


class LabResultResponse(LabResultBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class VisitCreate(BaseModel):
    patient_id: uuid.UUID
    visit_date: date
    ckd_stage: CKDStage
    notes: Optional[str] = None
    lab_result: LabResultBase


class VisitUpdate(BaseModel):
    visit_date: Optional[date] = None
    ckd_stage: Optional[CKDStage] = None
    notes: Optional[str] = None
    lab_result: Optional[LabResultBase] = None


class VisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    visit_date: date
    ckd_stage: CKDStage
    notes: Optional[str] = None
    created_at: datetime
    lab_result: Optional[LabResultResponse] = None


class VisitListResponse(BaseModel):
    visits: List[VisitResponse]
    total: int