from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient_profile import PatientProfile
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
)
from app.api.deps import get_current_user


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
    current_user: User = Depends(get_current_user),
):
    # Only doctors can create appointments
    if current_user.role != UserRole.doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create appointments.",
        )

    # Make sure the patient exists and belongs to this doctor
    patient = db.scalar(
        select(PatientProfile).where(
            PatientProfile.id == appointment_data.patient_id,
            PatientProfile.created_by_doctor_id == current_user.id,
            PatientProfile.is_active.is_(True),
        )
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    appointment = Appointment(
        doctor_id=current_user.id,
        patient_id=appointment_data.patient_id,
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
            Appointment.doctor_id == current_user.id
        )
    elif current_user.role == UserRole.patient:
        profile = db.scalar(
            select(PatientProfile).where(
                PatientProfile.user_id == current_user.id
            )
        )
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found.",
            )
        query = select(Appointment).where(
            Appointment.patient_id == profile.id
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to view appointments.",
        )

    if appointment_date is not None:
        start_datetime = datetime.combine(
            appointment_date,
            time.min,
        )

        end_datetime = start_datetime + timedelta(days=1)

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
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view their next appointment.",
        )

    profile = db.scalar(
        select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

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
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view appointments.",
        )

    appointment = db.scalar(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_user.id,
        )
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    return appointment


@router.put(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def update_appointment(
    appointment_id: UUID,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update appointments.",
        )

    appointment = db.scalar(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_user.id,
        )
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

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
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can delete appointments.",
        )

    appointment = db.scalar(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_user.id,
        )
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    db.delete(appointment)
    db.commit()
