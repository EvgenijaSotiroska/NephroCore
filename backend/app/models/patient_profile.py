import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Sex(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class CKDEtiology(str, enum.Enum):
    DIABETIC_NEPHROPATHY = "diabetic_nephropathy"
    HYPERTENSIVE_NEPHROPATHY = "hypertensive_nephropathy"
    GLOMERULONEPHRITIS = "glomerulonephritis"
    POLYCYSTIC_KIDNEY_DISEASE = "polycystic_kidney_disease"
    OBSTRUCTIVE_UROPATHY = "obstructive_uropathy"
    LUPUS_NEPHRITIS = "lupus_nephritis"
    IGA_NEPHROPATHY = "iga_nephropathy"
    OTHER = "other"
    UNKNOWN = "unknown"


class DialysisStatus(str, enum.Enum):
    PRE_DIALYSIS = "pre_dialysis"
    ON_DIALYSIS = "on_dialysis"
    POST_TRANSPLANT = "post_transplant"


class DialysisModality(str, enum.Enum):
    HD = "hd"  # hemodialysis
    PD = "pd"  # peritoneal dialysis


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)

    created_by_doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    full_name = Column(String(150), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    sex = Column(Enum(Sex, name="sex_enum"), nullable=False)
    height_cm = Column(Numeric(5, 1), nullable=True)

    previous_conditions = Column(Text, nullable=True)
    genetic_risk_factors = Column(Text, nullable=True)
    comorbidities = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    smoking = Column(Boolean, nullable=True)

    # --- CKD-specific clinical context (drives RAG retrieval + staging logic) ---
    ckd_etiology = Column(Enum(CKDEtiology, name="ckd_etiology_enum"), nullable=True)
    diagnosis_date = Column(Date, nullable=True)
    baseline_egfr = Column(Numeric(5, 2), nullable=True)

    dialysis_status = Column(
        Enum(DialysisStatus, name="dialysis_status_enum"),
        nullable=False,
        default=DialysisStatus.PRE_DIALYSIS,
    )
    dialysis_modality = Column(Enum(DialysisModality, name="dialysis_modality_enum"), nullable=True)

    invite_code = Column(String(20), unique=True, index=True, nullable=True)
    invite_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_activated = Column(Boolean, default=False, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)  # soft-delete when doctor stops treating patient
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])