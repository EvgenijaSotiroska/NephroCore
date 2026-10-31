import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class BloodPressureReading(Base):
    """One home blood pressure measurement entered by the patient (the clinic readings are stored with the visits)."""

    __tablename__ = "blood_pressure_readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    reading_date = Column(Date, nullable=False, index=True)
    systolic = Column(Integer, nullable=False)
    diastolic = Column(Integer, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    patient = relationship(
        "PatientProfile",
        back_populates="blood_pressure_readings",
        foreign_keys=[patient_id],
    )
