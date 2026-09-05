from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_doctor, require_patient
from app.core.config import settings
from app.core.security import generate_invite_code
from app.db.session import get_db
from app.models.patient_profile import PatientProfile
from app.models.user import User, UserRole
from app.schemas.patient import PatientCreateRequest, PatientCreateResponse, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientCreateResponse, status_code=201)
def create_patient(
    payload: PatientCreateRequest,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):

    # Placeholder user row, unclaimed until the patient activates.
    patient_user = User(role=UserRole.patient, is_active=False)
    db.add(patient_user)
    db.flush()

    invite_code = generate_invite_code()

    while db.query(PatientProfile).filter(
        PatientProfile.invite_code == invite_code
    ).first():
        invite_code = generate_invite_code()

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
        invite_code_expires_at=(
            datetime.now(timezone.utc)
            + timedelta(days=settings.INVITE_CODE_EXPIRE_DAYS)
        ),
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
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_patient.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    profile = db.query(PatientProfile).filter(
        PatientProfile.id == patient_id,
        PatientProfile.created_by_doctor_id == current_doctor.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found")
    return profile


@router.get("", response_model=list[PatientOut])
def list_my_patients(
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    return db.query(PatientProfile).filter(PatientProfile.created_by_doctor_id == current_doctor.id).all()
