import uuid

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Null until the patient redeems their invite code and this profile is linked
    # to a claimed User row.
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)

    # The doctor who created (and owns write-access to) this profile.
    created_by_doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # --- Clinical profile fields (doctor-editable only) ---
    full_name = Column(String(150), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    previous_conditions = Column(Text, nullable=True)
    genetic_risk_factors = Column(Text, nullable=True)
    comorbidities = Column(JSON, nullable=True)      # e.g. {"diabetes": true, "hypertension": true}
    current_medications = Column(JSON, nullable=True)  # e.g. [{"name": "...", "dose": "..."}]
    allergies = Column(Text, nullable=True)
    smoking = Column(Boolean, nullable=True)
    alcohol = Column(Boolean, nullable=True)

    # --- Invite / activation ---
    invite_code = Column(String(20), unique=True, index=True, nullable=True)
    invite_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_activated = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])
