import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"

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

    scheduled_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    duration_minutes = Column(
        Integer,
        nullable=False,
        default=30,
    )

    appointment_type = Column(
        Text,
        nullable=True,
    )

    status = Column(
        Enum(
            AppointmentStatus,
            name="appointment_status_enum",
        ),
        nullable=False,
        default=AppointmentStatus.SCHEDULED,
    )

    notes = Column(
        Text,
        nullable=True,
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

    doctor = relationship(
        "User",
        foreign_keys=[doctor_id],
    )

    patient = relationship(
        "PatientProfile",
        back_populates="appointments",
        foreign_keys=[patient_id],
    )