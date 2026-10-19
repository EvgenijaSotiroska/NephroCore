import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AIAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    analysis: str
    created_at: datetime