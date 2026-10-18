from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_own_patient_profile, get_owned_patient, patient_ids_of
from app.db.session import get_db
from app.models.symptom import Symptom, SymptomIntensity
from app.models.user import User, UserRole
from app.schemas.symptom import SymptomCreate, SymptomResponse, SymptomUpdate


router = APIRouter(prefix="/symptoms", tags=["Symptoms"])


def _scope(query, db: Session, user: User):
    """Doctors see symptoms of their patients, patients see only their own."""
    if user.role == UserRole.doctor:
        return query.where(Symptom.patient_id.in_(patient_ids_of(user)))
    return query.where(Symptom.patient_id == get_own_patient_profile(db, user).id)


def _get_symptom_or_404(db: Session, symptom_id: UUID, user: User) -> Symptom:
    symptom = db.scalar(
        _scope(select(Symptom).where(Symptom.id == symptom_id), db, user)
    )
    if symptom is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symptom not found.",
        )
    return symptom


@router.post("", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
def create_symptom(
    data: SymptomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.doctor:
        if data.patient_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="patient_id is required.",
            )
        patient = get_owned_patient(db, data.patient_id, current_user, active_only=True)
    else:
        patient = get_own_patient_profile(db, current_user)
        if not patient.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your profile is not active. Ask your doctor.",
            )

    symptom = Symptom(
        patient_id=patient.id,
        symptom_date=data.symptom_date,
        description=data.description,
        intensity=data.intensity,
    )
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return symptom


@router.get("", response_model=list[SymptomResponse])
def list_symptoms(
    patient_id: UUID | None = Query(default=None),  # doctors only; ignored for patients
    intensity: SymptomIntensity | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _scope(select(Symptom), db, current_user)

    if patient_id is not None and current_user.role == UserRole.doctor:
        query = query.where(Symptom.patient_id == patient_id)
    if intensity is not None:
        query = query.where(Symptom.intensity == intensity)
    if date_from is not None:
        query = query.where(Symptom.symptom_date >= date_from)
    if date_to is not None:
        query = query.where(Symptom.symptom_date <= date_to)

    query = query.order_by(Symptom.symptom_date.desc(), Symptom.created_at.desc())
    return db.scalars(query).all()


@router.get("/{symptom_id}", response_model=SymptomResponse)
def get_symptom(
    symptom_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_symptom_or_404(db, symptom_id, current_user)


@router.put("/{symptom_id}", response_model=SymptomResponse)
def update_symptom(
    symptom_id: UUID,
    data: SymptomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    symptom = _get_symptom_or_404(db, symptom_id, current_user)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(symptom, field, value)

    db.commit()
    db.refresh(symptom)
    return symptom


@router.delete("/{symptom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_symptom(
    symptom_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    symptom = _get_symptom_or_404(db, symptom_id, current_user)

    db.delete(symptom)
    db.commit()