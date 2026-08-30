import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class UserRole(str, enum.Enum):
    doctor = "doctor"
    patient = "patient"


class User(Base):
    """
    Auth-only table. Clinical/profile data lives in DoctorProfile / PatientProfile.

    For patients: created with username=None, hashed_password=None, is_active=False
    by the doctor who registers them. The row is "claimed" (username + password set,
    is_active=True) when the patient redeems their invite code.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    username = Column(String(50), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)

    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor_profile = relationship(
        "DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    patient_profile = relationship(
        "PatientProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="PatientProfile.user_id",
    )
