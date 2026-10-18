from zoneinfo import ZoneInfo

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Clinic dates and times (appointments, "today", ages) are read in this timezone.
CLINIC_TZ = ZoneInfo("Europe/Skopje")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str
    SECRET_KEY: str

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 360

    INVITE_CODE_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. Generate one with: "
                'python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        return value


settings = Settings()
