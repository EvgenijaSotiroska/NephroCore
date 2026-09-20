import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.lab_parameters import CKDStage, get_stage_parameter_definitions
from app.models.result import Visit, LabResult
from app.models.user import User
from app.schemas.result import (
    VisitCreate,
    VisitUpdate,
    VisitResponse,
    VisitListResponse,
    StageParametersResponse,
)

from app.api.deps import require_doctor

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/parameters", response_model=List[StageParametersResponse])
def get_all_stage_parameters():
    """Full catalog: for every CKD stage, which parameter keys the entry
    form should show. Pure domain data (keys + value types) — the
    frontend merges this with its own Macedonian label dictionary and
    switches the visible fields locally when the doctor clicks a stage."""
    return [
        StageParametersResponse(
            stage=stage,
            parameters=get_stage_parameter_definitions(stage),
        )
        for stage in CKDStage
    ]


@router.get("/parameters/{stage}", response_model=StageParametersResponse)
def get_stage_parameters(stage: CKDStage):
    return StageParametersResponse(
        stage=stage,
        parameters=get_stage_parameter_definitions(stage),
    )



@router.get("/patient/{patient_id}/suggested-stage", response_model=CKDStage)
def get_suggested_stage(patient_id: uuid.UUID, db: Session = Depends(get_db)):
    """Return the CKD stage from the patient's most recent visit so the
    entry form can preselect it. Defaults to G1 for a brand-new patient."""
    last_visit = (
        db.query(Visit)
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.desc())
        .first()
    )
    return last_visit.ckd_stage if last_visit else CKDStage.G1


@router.post("/", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def create_visit(
    payload: VisitCreate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    visit = Visit(
        patient_id=payload.patient_id,
        doctor_id=current_doctor.id,
        visit_date=payload.visit_date,
        ckd_stage=payload.ckd_stage,
        notes=payload.notes,
    )
    db.add(visit)
    db.flush()  # get visit.id before creating the lab result row

    lab_result = LabResult(visit_id=visit.id, **payload.lab_result.model_dump())
    db.add(lab_result)

    db.commit()
    db.refresh(visit)
    return visit


@router.get("/patient/{patient_id}", response_model=VisitListResponse)
def list_patient_visits(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    query = (
        db.query(Visit)
        .options(joinedload(Visit.lab_result))
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.desc())
    )
    visits = query.all()
    return VisitListResponse(visits=visits, total=len(visits))


@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(
    visit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    visit = (
        db.query(Visit)
        .options(joinedload(Visit.lab_result))
        .filter(Visit.id == visit_id)
        .first()
    )
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit


@router.put("/{visit_id}", response_model=VisitResponse)
def update_visit(
    visit_id: uuid.UUID,
    payload: VisitUpdate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    visit = (
        db.query(Visit)
        .options(joinedload(Visit.lab_result))
        .filter(Visit.id == visit_id)
        .first()
    )
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    if payload.visit_date is not None:
        visit.visit_date = payload.visit_date
    if payload.ckd_stage is not None:
        visit.ckd_stage = payload.ckd_stage
    if payload.notes is not None:
        visit.notes = payload.notes

    if payload.lab_result is not None:
        for key, value in payload.lab_result.model_dump(exclude_unset=True).items():
            setattr(visit.lab_result, key, value)

    db.commit()
    db.refresh(visit)
    return visit


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visit(
    visit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    db.delete(visit)
    db.commit()