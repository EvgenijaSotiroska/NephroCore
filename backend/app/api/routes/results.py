import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.lab_parameters import get_stage_parameter_definitions, get_all_parameters
from app.models.result import CKDStage, Visit, LabResult
from app.models.user import User
from app.schemas.result import (
    VisitCreate,
    VisitUpdate,
    VisitResponse,
    VisitListResponse,
    StageParametersResponse,
    ParameterDefinition
)

from app.api.deps import (
    get_current_user,
    get_owned_patient,
    get_owned_visit,
    get_viewable_patient,
    require_doctor,
)

router = APIRouter(prefix="/results", tags=["results"])

@router.get("/parameters", response_model=list[StageParametersResponse])
def get_all_stage_parameters(db: Session = Depends(get_db)):
    """Full catalog: for every CKD stage, which parameters the entry form
    should show, already carrying their Macedonian label/unit/reference."""
    return [
        StageParametersResponse(
            stage=stage,
            parameters=get_stage_parameter_definitions(stage, db),
        )
        for stage in CKDStage
    ]

@router.get("/parameters/all", response_model=list[ParameterDefinition])
def get_all_parameters_catalog(db: Session = Depends(get_db)):
    return get_all_parameters(db)


@router.get("/parameters/{stage}", response_model=StageParametersResponse)
def get_stage_parameters(stage: CKDStage, db: Session = Depends(get_db)):
    return StageParametersResponse(
        stage=stage,
        parameters=get_stage_parameter_definitions(stage, db),
    )


@router.post("/", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def create_visit(
    payload: VisitCreate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    patient = get_owned_patient(db, payload.patient_id, current_doctor, active_only=True)

    visit = Visit(
        patient_id=patient.id,
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
    current_user: User = Depends(get_current_user),
):
    get_viewable_patient(db, patient_id, current_user)

    visits = db.scalars(
        select(Visit)
        .options(joinedload(Visit.lab_result))
        .where(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.desc())
    ).all()
    return VisitListResponse(visits=visits, total=len(visits))


@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(
    visit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    return get_owned_visit(db, visit_id, current_doctor)


@router.put("/{visit_id}", response_model=VisitResponse)
def update_visit(
    visit_id: uuid.UUID,
    payload: VisitUpdate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    visit = get_owned_visit(db, visit_id, current_doctor)

    # Only fields that were actually sent are changed. Sending "notes": null clears the notes;
    # visit_date and ckd_stage cannot be null (the schema rejects that).
    sent = payload.model_fields_set
    if "visit_date" in sent:
        visit.visit_date = payload.visit_date
    if "ckd_stage" in sent:
        visit.ckd_stage = payload.ckd_stage
    if "notes" in sent:
        visit.notes = payload.notes

    if payload.lab_result is not None:
        lab_values = payload.lab_result.model_dump(exclude_unset=True)
        if visit.lab_result is None:
            visit.lab_result = LabResult(**lab_values)
        else:
            for key, value in lab_values.items():
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
    visit = get_owned_visit(db, visit_id, current_doctor)
    db.delete(visit)
    db.commit()