import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base


class AIAnalysisKind(str, enum.Enum):
    DOCTOR = "doctor"    # clinical analysis written for the doctor
    PATIENT = "patient"  # plain-language explanation written for the patient


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The user who pressed the button. Kept as NULL if that account is deleted later.
    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    kind = Column(
        Enum(
            AIAnalysisKind,
            name="ai_analysis_kind_enum",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )

    analysis = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )