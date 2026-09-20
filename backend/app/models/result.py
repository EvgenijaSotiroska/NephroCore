import uuid

from sqlalchemy import Column, ForeignKey, Date, DateTime, Integer, Numeric, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base
from app.core.lab_parameters import CKDStage


class Visit(Base):
    """A single clinic visit / results entry for a patient."""

    __tablename__ = "visits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    visit_date = Column(Date, nullable=False)
    ckd_stage = Column(Enum(CKDStage, name="ckd_stage_enum"), nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    lab_result = relationship(
        "LabResult",
        back_populates="visit",
        uselist=False,
        cascade="all, delete-orphan",
    )

    patient = relationship("PatientProfile", back_populates="visits")
    doctor = relationship("User", foreign_keys=[doctor_id])


class LabResult(Base):
    """The lab values recorded for one visit."""

    __tablename__ = "lab_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id = Column(
        UUID(as_uuid=True),
        ForeignKey("visits.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # Core (all stages)
    egfr = Column(Numeric(5, 2), nullable=True)
    creatinine = Column(Numeric(6, 2), nullable=True)
    acr = Column(Numeric(7, 2), nullable=True)
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)

    # G3a+
    phosphate = Column(Numeric(4, 2), nullable=True)
    calcium = Column(Numeric(4, 2), nullable=True)
    hemoglobin = Column(Numeric(5, 2), nullable=True)
    potassium = Column(Numeric(4, 2), nullable=True)

    # G4+
    pth = Column(Numeric(6, 2), nullable=True)
    bicarbonate = Column(Numeric(4, 2), nullable=True)

    # G5
    urea = Column(Numeric(5, 2), nullable=True)
    albumin = Column(Numeric(5, 2), nullable=True)

    visit = relationship("Visit", back_populates="lab_result")