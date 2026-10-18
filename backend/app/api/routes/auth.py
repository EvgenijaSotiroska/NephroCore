from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

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


# The request schemas lowercase emails and usernames. Comparing with lower() on the
# column as well also matches accounts that were saved before that rule existed.

@router.post("/register/doctor", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(payload: DoctorRegisterRequest, db: Session = Depends(get_db)):
    already_registered = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Username or email already registered.",
    )

    if db.scalar(
        select(User).where(
            or_(
                func.lower(User.username) == payload.username,
                func.lower(User.email) == payload.email,
            )
        )
    ):
        raise already_registered

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.doctor,
        is_active=True,
    )
    try:
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
    except IntegrityError:
        # Another request registered the same username or email a moment ago.
        db.rollback()
        raise already_registered

    db.refresh(user)

    return _issue_token(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password.",
    )

    if payload.role == "doctor":
        if not payload.email:
            raise invalid_credentials

        user = db.scalar(
            select(User).where(
                func.lower(User.email) == payload.email,
                User.role == UserRole.doctor,
            )
        )

    else:
        if not payload.username:
            raise invalid_credentials

        user = db.scalar(
            select(User).where(
                func.lower(User.username) == payload.username,
                User.role == UserRole.patient,
            )
        )

    if not user or not user.hashed_password:
        raise invalid_credentials

    if not verify_password(payload.password, user.hashed_password):
        raise invalid_credentials

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active.",
        )

    return _issue_token(user)


@router.post("/activate", response_model=TokenResponse)
def activate_invite(payload: ActivateInviteRequest, db: Session = Depends(get_db)):
    profile = db.scalar(
        select(PatientProfile).where(
            PatientProfile.invite_code == payload.invite_code,
            PatientProfile.is_activated.is_(False),
        )
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already-used invite code.",
        )

    if profile.invite_code_expires_at and profile.invite_code_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite code has expired. Ask your doctor for a new one.",
        )

    username_taken = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Username already taken.",
    )

    if db.scalar(select(User).where(func.lower(User.username) == payload.username)):
        raise username_taken

    user = db.scalar(select(User).where(User.id == profile.user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Linked user record not found.",
        )

    user.username = payload.username
    user.hashed_password = hash_password(payload.password)
    user.is_active = True

    profile.is_activated = True
    profile.invite_code = None
    profile.invite_code_expires_at = None

    try:
        db.commit()
    except IntegrityError:
        # Someone took this username between the check above and the commit.
        db.rollback()
        raise username_taken

    db.refresh(user)

    return _issue_token(user)
