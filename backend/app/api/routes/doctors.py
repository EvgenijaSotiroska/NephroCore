from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_doctor
from app.db.session import get_db
from app.models.doctor_profile import DoctorProfile
from app.models.user import User
from app.schemas.doctor import DoctorProfileResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get("/me", response_model=DoctorProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    profile = db.scalar(
        select(DoctorProfile).where(DoctorProfile.user_id == current_doctor.id)
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )
    return profile