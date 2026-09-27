from pydantic import BaseModel


class AIAnalysisResponse(BaseModel):
    analysis: str