from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.doctor_profile import DoctorProfile
from app.models.patient_profile import PatientProfile
from app.models.user import User, UserRole
from app.schemas.auth import (
    ActivateInviteRequest,
    DoctorRegisterRequest,
    LoginRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_token(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        role=user.role.value,
    )


@router.post("/register/doctor", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(payload: DoctorRegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first():
        raise HTTPException(status_code=400, detail="Username or email already registered")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.doctor,
        is_active=True,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    profile = DoctorProfile(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        hospital=payload.hospital,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    return _issue_token(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
    )

    if not user or not user.hashed_password:
        raise invalid_credentials
    if not verify_password(payload.password, user.hashed_password):
        raise invalid_credentials
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is not active")

    return _issue_token(user)


@router.post("/activate", response_model=TokenResponse)
def activate_invite(payload: ActivateInviteRequest, db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(
        PatientProfile.invite_code == payload.invite_code,
        PatientProfile.is_activated.is_(False),
    ).first()

    if not profile:
        raise HTTPException(status_code=400, detail="Invalid or already-used invite code")

    if profile.invite_code_expires_at and profile.invite_code_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite code has expired. Ask your doctor for a new one.")

    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user:
        raise HTTPException(status_code=500, detail="Linked user record not found")

    user.username = payload.username
    user.hashed_password = hash_password(payload.password)
    user.is_active = True

    profile.is_activated = True
    profile.invite_code = None
    profile.invite_code_expires_at = None

    db.commit()
    db.refresh(user)

    return _issue_token(user)
