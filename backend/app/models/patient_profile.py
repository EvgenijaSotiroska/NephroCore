import enum
import uuid

from sqlalchemy import (
    JSON,
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

    # Null until the patient redeems their invite code and this profile is linked
    # to a claimed User row.
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)

    # The doctor who created (and owns write-access to) this profile.
    created_by_doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # --- Core demographic fields (doctor-editable only) ---
    full_name = Column(String(150), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    sex = Column(Enum(Sex, name="sex_enum"), nullable=False)  # required: affects eGFR formula + reference ranges
    height_cm = Column(Numeric(5, 1), nullable=True)  # static enough for adults; weight goes in time-series table

    # --- Clinical history ---
    previous_conditions = Column(Text, nullable=True)
    genetic_risk_factors = Column(Text, nullable=True)
    comorbidities = Column(JSON, nullable=True)  # e.g. {"diabetes": true, "hypertension": true}
    current_medications = Column(JSON, nullable=True)  # e.g. [{"name": "...", "dose": "..."}]
    allergies = Column(Text, nullable=True)
    smoking = Column(Boolean, nullable=True)
    alcohol = Column(Boolean, nullable=True)

    # --- CKD-specific clinical context (drives RAG retrieval + staging logic) ---
    ckd_etiology = Column(Enum(CKDEtiology, name="ckd_etiology_enum"), nullable=True)
    diagnosis_date = Column(Date, nullable=True)
    baseline_egfr = Column(Numeric(5, 2), nullable=True)  # mL/min/1.73m^2 at diagnosis/first recorded visit

    dialysis_status = Column(
        Enum(DialysisStatus, name="dialysis_status_enum"),
        nullable=False,
        default=DialysisStatus.PRE_DIALYSIS,
    )
    dialysis_modality = Column(Enum(DialysisModality, name="dialysis_modality_enum"), nullable=True)  # only if ON_DIALYSIS

    # --- Invite / activation ---
    invite_code = Column(String(20), unique=True, index=True, nullable=True)
    invite_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_activated = Column(Boolean, default=False, nullable=False)

    # --- Lifecycle ---
    is_active = Column(Boolean, default=True, nullable=False)  # soft-delete when doctor stops treating patient
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])