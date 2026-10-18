from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_user,
    get_own_patient_profile,
    get_owned_patient,
    patient_ids_of,
    require_doctor,
)
from app.db.session import get_db
from app.models.medication import Medication
from app.models.user import User, UserRole
from app.schemas.medication import (
    MedicationCreate,
    MedicationResponse,
    MedicationUpdate,
)

router = APIRouter(prefix="/medications", tags=["Medications"])

def _scope(query, db: Session, user: User):
    """Doctors see their patients' medications, patients see only their own active ones."""
    if user.role == UserRole.doctor:
        return query.where(Medication.patient_id.in_(patient_ids_of(user)))
    return query.where(
        Medication.patient_id == get_own_patient_profile(db, user).id,
        Medication.is_active.is_(True),
    )


def _get_medication_or_404(db: Session, medication_id: UUID, user: User) -> Medication:
    medication = db.scalar(
        _scope(select(Medication).where(Medication.id == medication_id), db, user)
    )
    if medication is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found.",
        )
    return medication


@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(
    data: MedicationCreate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    patient = get_owned_patient(db, data.patient_id, current_doctor, active_only=True)

    medication = Medication(
        doctor_id=current_doctor.id,
        patient_id=patient.id,
        name=data.name,
        description=data.description,
        dose=data.dose,
        times=data.times,
        is_active=data.is_active,
    )
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return medication


@router.get("", response_model=list[MedicationResponse])
def list_medications(
    patient_id: UUID | None = Query(default=None),  # doctors only; ignored for patients
    is_active: bool | None = Query(default=None),  # doctors only; patients always get active
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _scope(select(Medication), db, current_user)

    if current_user.role == UserRole.doctor:
        if patient_id is not None:
            query = query.where(Medication.patient_id == patient_id)
        if is_active is not None:
            query = query.where(Medication.is_active.is_(is_active))

    query = query.order_by(Medication.name)
    return db.scalars(query).all()


@router.get("/{medication_id}", response_model=MedicationResponse)
def get_medication(
    medication_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_medication_or_404(db, medication_id, current_user)


@router.put("/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: UUID,
    data: MedicationUpdate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    medication = _get_medication_or_404(db, medication_id, current_doctor)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(medication, field, value)

    db.commit()
    db.refresh(medication)
    return medication


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(
    medication_id: UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    medication = _get_medication_or_404(db, medication_id, current_doctor)

    db.delete(medication)
    db.commit()