import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import decode_token
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.patient_profile import PatientProfile
from app.models.result import Visit
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*allowed_roles: UserRole):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return dependency


require_doctor = require_role(UserRole.doctor)
require_patient = require_role(UserRole.patient)


# A patient belongs to exactly one doctor: patient_profiles.created_by_doctor_id.
# Every permission check for a doctor goes through it (the doctor_id columns on other tables
# only record who created that row and are never used to decide access).

def patient_ids_of(doctor: User):
    """A query for the ids of this doctor's patients, to use as `Table.patient_id.in_(...)`."""
    return select(PatientProfile.id).where(PatientProfile.created_by_doctor_id == doctor.id)


def get_own_patient_profile(db: Session, user: User) -> PatientProfile:
    """The logged-in patient's own profile."""
    profile = db.scalar(select(PatientProfile).where(PatientProfile.user_id == user.id))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


def get_owned_patient(
    db: Session,
    patient_id: uuid.UUID,
    doctor: User,
    *,
    active_only: bool = False,
) -> PatientProfile:
    """A patient this doctor created.

    Inactive patients (no longer followed, e.g. switched doctor) stay on record and
    can be viewed. Pass active_only=True for actions that add new data for the patient.
    """
    patient = db.scalar(
        select(PatientProfile).where(
            PatientProfile.id == patient_id,
            PatientProfile.created_by_doctor_id == doctor.id,
        )
    )
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    if active_only and not patient.is_active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Patient is not active.")
    return patient


def get_viewable_patient(db: Session, patient_id: uuid.UUID, user: User) -> PatientProfile:
    """The doctor who created the patient, or the patient themself."""
    patient = db.scalar(select(PatientProfile).where(PatientProfile.id == patient_id))
    allowed = patient is not None and (
        patient.created_by_doctor_id == user.id or patient.user_id == user.id
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    return patient


def get_owned_visit(db: Session, visit_id: uuid.UUID, doctor: User) -> Visit:
    """A visit that belongs to one of this doctor's patients."""
    visit = db.scalar(
        select(Visit)
        .options(joinedload(Visit.lab_result))
        .where(
            Visit.id == visit_id,
            Visit.patient_id.in_(patient_ids_of(doctor)),
        )
    )
    if visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found.")
    return visit


def get_owned_appointment(db: Session, appointment_id: uuid.UUID, doctor: User) -> Appointment:
    """An appointment of one of this doctor's patients."""
    appointment = db.scalar(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.patient_id.in_(patient_ids_of(doctor)),
        )
    )
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    return appointment
