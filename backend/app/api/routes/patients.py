from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    get_own_patient_profile,
    get_owned_patient,
    require_doctor,
    require_patient,
)
from app.core.config import settings
from app.core.security import generate_invite_code
from app.db.session import get_db
from app.models.patient_profile import PatientProfile
from app.models.user import User, UserRole
from app.schemas.patient import (
    PatientCreateRequest,
    PatientCreateResponse,
    PatientOut,
    PatientStatusUpdate,
    PatientUpdateRequest,
)

router = APIRouter(prefix="/patients", tags=["patients"])


def _new_unique_invite_code(db: Session) -> str:
    invite_code = generate_invite_code()
    while db.scalar(select(PatientProfile).where(PatientProfile.invite_code == invite_code)):
        invite_code = generate_invite_code()
    return invite_code


def _invite_code_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.INVITE_CODE_EXPIRE_DAYS)


@router.post("", response_model=PatientCreateResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreateRequest,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):

    # Placeholder user row, unclaimed until the patient activates.
    patient_user = User(role=UserRole.patient, is_active=False)
    db.add(patient_user)
    db.flush()

    invite_code = _new_unique_invite_code(db)

    profile = PatientProfile(
        user_id=patient_user.id,
        created_by_doctor_id=current_doctor.id,

        # Demographics
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        sex=payload.sex,
        height_cm=payload.height_cm,

        # Clinical history
        previous_conditions=payload.previous_conditions,
        genetic_risk_factors=payload.genetic_risk_factors,
        comorbidities=payload.comorbidities,
        current_medications=payload.current_medications,
        smoking=payload.smoking,

        # CKD-specific
        ckd_etiology=payload.ckd_etiology,
        diagnosis_date=payload.diagnosis_date,
        baseline_egfr=payload.baseline_egfr,
        dialysis_status=payload.dialysis_status,
        dialysis_modality=payload.dialysis_modality,

        # Invite / activation
        invite_code=invite_code,
        invite_code_expires_at=_invite_code_expiry(),
        is_activated=False,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return PatientCreateResponse(
        id=str(profile.id),
        full_name=profile.full_name,
        invite_code=profile.invite_code,
        invite_code_expires_at=profile.invite_code_expires_at,
    )

@router.get("/me", response_model=PatientOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_patient: User = Depends(require_patient),
):
    return get_own_patient_profile(db, current_patient)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    return get_owned_patient(db, patient_id, current_doctor)


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: UUID,
    payload: PatientUpdateRequest,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    """Edit a patient's profile. Works for inactive patients too."""
    patient = get_owned_patient(db, patient_id, current_doctor)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.post("/{patient_id}/invite-code", response_model=PatientOut)
def regenerate_invite_code(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    patient = get_owned_patient(db, patient_id, current_doctor)

    if patient.is_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient has already activated their account.",
        )

    patient.invite_code = _new_unique_invite_code(db)
    patient.invite_code_expires_at = _invite_code_expiry()
    db.commit()
    db.refresh(patient)
    return patient


@router.patch("/{patient_id}/status", response_model=PatientOut)
def set_patient_status(
    patient_id: UUID,
    payload: PatientStatusUpdate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    patient = get_owned_patient(db, patient_id, current_doctor)
    patient.is_active = payload.is_active
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=list[PatientOut])
def list_my_patients(
    is_active: bool | None = Query(default=None, description="Only active or only inactive patients."),
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    query = select(PatientProfile).where(PatientProfile.created_by_doctor_id == current_doctor.id)
    if is_active is not None:
        query = query.where(PatientProfile.is_active.is_(is_active))
    return db.scalars(query).all()
