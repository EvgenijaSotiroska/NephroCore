from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import CLINIC_TZ
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
)
from app.api.deps import (
    get_current_user,
    get_own_patient_profile,
    get_owned_appointment,
    get_owned_patient,
    patient_ids_of,
    require_doctor,
    require_patient,
)

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    patient = get_owned_patient(
        db, appointment_data.patient_id, current_doctor, active_only=True
    )

    appointment = Appointment(
        doctor_id=current_doctor.id,
        patient_id=patient.id,
        scheduled_at=appointment_data.scheduled_at,
        duration_minutes=appointment_data.duration_minutes,
        appointment_type=appointment_data.appointment_type,
        notes=appointment_data.notes,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment


@router.get(
    "",
    response_model=list[AppointmentResponse],
)
def get_appointments(
    appointment_date: date | None = Query(
        default=None,
        description="Return appointments for a specific date.",
    ),
    patient_id: UUID | None = Query(
        default=None,
        description="Return only appointments for this patient.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.doctor:
        query = select(Appointment).where(
            Appointment.patient_id.in_(patient_ids_of(current_user))
        )
    elif current_user.role == UserRole.patient:
        profile = get_own_patient_profile(db, current_user)
        query = select(Appointment).where(
            Appointment.patient_id == profile.id
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to view appointments.",
        )

    if appointment_date is not None:
        # The day runs from midnight to midnight in clinic (Skopje) time.
        start_datetime = datetime.combine(
            appointment_date,
            time.min,
            tzinfo=CLINIC_TZ,
        )

        end_datetime = datetime.combine(
            appointment_date + timedelta(days=1),
            time.min,
            tzinfo=CLINIC_TZ,
        )

        query = query.where(
            Appointment.scheduled_at >= start_datetime,
            Appointment.scheduled_at < end_datetime,
        )

    if patient_id is not None:
        query = query.where(Appointment.patient_id == patient_id)

    query = query.order_by(Appointment.scheduled_at)

    return db.scalars(query).all()


@router.get(
    "/next",
    response_model=AppointmentResponse | None,
)
def get_my_next_appointment(
    db: Session = Depends(get_db),
    current_patient: User = Depends(require_patient),
):
    profile = get_own_patient_profile(db, current_patient)

    return db.scalar(
        select(Appointment)
        .where(
            Appointment.patient_id == profile.id,
            Appointment.status == AppointmentStatus.SCHEDULED,
            Appointment.scheduled_at >= datetime.now(timezone.utc),
        )
        .order_by(Appointment.scheduled_at)
        .limit(1)
    )


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    return get_owned_appointment(db, appointment_id, current_doctor)


@router.put(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def update_appointment(
    appointment_id: UUID,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    appointment = get_owned_appointment(db, appointment_id, current_doctor)

    update_data = appointment_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)

    return appointment


@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    appointment = get_owned_appointment(db, appointment_id, current_doctor)

    db.delete(appointment)
    db.commit()
