from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_own_patient_profile, get_owned_patient, require_patient
from app.db.session import get_db
from app.models.blood_pressure import BloodPressureReading
from app.models.result import Visit
from app.models.user import User, UserRole
from app.schemas.blood_pressure import BloodPressureCreate, BloodPressureResponse


router = APIRouter(prefix="/blood-pressure", tags=["Blood pressure"])

MAX_READINGS_PER_DAY = 3
MAX_READINGS_RETURNED = 200


@router.post("", response_model=BloodPressureResponse, status_code=status.HTTP_201_CREATED)
def create_reading(
    data: BloodPressureCreate,
    db: Session = Depends(get_db),
    current_patient: User = Depends(require_patient),
):
    """The patient adds one home reading, at most MAX_READINGS_PER_DAY for the same day."""
    patient = get_own_patient_profile(db, current_patient)
    if not patient.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your profile is not active. Ask your doctor.",
        )

    readings_that_day = db.scalar(
        select(func.count())
        .select_from(BloodPressureReading)
        .where(
            BloodPressureReading.patient_id == patient.id,
            BloodPressureReading.reading_date == data.reading_date,
        )
    )
    if readings_that_day >= MAX_READINGS_PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You can enter at most {MAX_READINGS_PER_DAY} readings per day.",
        )

    reading = BloodPressureReading(
        patient_id=patient.id,
        reading_date=data.reading_date,
        systolic=data.systolic,
        diastolic=data.diastolic,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("", response_model=list[BloodPressureResponse])
def list_readings(
    patient_id: UUID | None = Query(default=None),  # doctors only; ignored for patients
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patients get their own readings. A doctor gets only the readings of the patient since the
    latest visit (all of them if there is no visit yet)."""
    if current_user.role == UserRole.doctor:
        if patient_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="patient_id is required.",
            )
        patient = get_owned_patient(db, patient_id, current_user)
        query = select(BloodPressureReading).where(BloodPressureReading.patient_id == patient.id)

        last_visit_date = db.scalar(
            select(func.max(Visit.visit_date)).where(Visit.patient_id == patient.id)
        )
        if last_visit_date is not None:
            query = query.where(BloodPressureReading.reading_date >= last_visit_date)
    else:
        patient = get_own_patient_profile(db, current_user)
        query = select(BloodPressureReading).where(BloodPressureReading.patient_id == patient.id)

    query = query.order_by(
        BloodPressureReading.reading_date.desc(), BloodPressureReading.created_at.desc()
    ).limit(MAX_READINGS_RETURNED)
    return db.scalars(query).all()


@router.delete("/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reading(
    reading_id: UUID,
    db: Session = Depends(get_db),
    current_patient: User = Depends(require_patient),
):
    """The patient removes one of their own readings, for example one entered by mistake."""
    patient = get_own_patient_profile(db, current_patient)
    reading = db.scalar(
        select(BloodPressureReading).where(
            BloodPressureReading.id == reading_id,
            BloodPressureReading.patient_id == patient.id,
        )
    )
    if reading is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reading not found.")

    db.delete(reading)
    db.commit()
