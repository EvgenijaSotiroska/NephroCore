import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Text, Time
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression, func

from app.db.session import Base


class Medication(Base):
    __tablename__ = "medications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)  # why it is prescribed
    dose = Column(Text, nullable=False)  # e.g. "1 таблета (500 mg)"
    times = Column(ARRAY(Time), nullable=False)  # times of day to take it

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=expression.true(),
    )

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

    doctor = relationship("User", foreign_keys=[doctor_id])

    patient = relationship(
        "PatientProfile",
        back_populates="medications",
        foreign_keys=[patient_id],
    )