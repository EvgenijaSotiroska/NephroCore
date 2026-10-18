from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from typing import Literal
from uuid import UUID

# bcrypt only reads the first 72 bytes of a password. Cyrillic letters take
# 2 bytes each in UTF-8, so the limit is checked in bytes, not characters.
MAX_PASSWORD_BYTES = 72


def _check_password_bytes(value: str) -> str:
    if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Password must be at most {MAX_PASSWORD_BYTES} bytes.")
    return value


def _lowercase(value: str | None) -> str | None:
    """Emails and usernames are case-insensitive, so they are stored and compared in lowercase."""
    return value.strip().lower() if value is not None else None


class DoctorRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    hospital: str | None = Field(default=None, max_length=200)

    @field_validator("username", "email")
    @classmethod
    def lowercase_identifiers(cls, value: str) -> str:
        return _lowercase(value)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return _check_password_bytes(value)


class LoginRequest(BaseModel):
    role: Literal["doctor", "patient"]
    email: EmailStr | None = None
    username: str | None = Field(default=None, max_length=50)
    password: str

    @field_validator("username", "email")
    @classmethod
    def lowercase_identifiers(cls, value: str | None) -> str | None:
        return _lowercase(value)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return _check_password_bytes(value)


class ActivateInviteRequest(BaseModel):
    invite_code: str = Field(min_length=1, max_length=20)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)

    @field_validator("username")
    @classmethod
    def lowercase_username(cls, value: str) -> str:
        return _lowercase(value)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return _check_password_bytes(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str | None
    role: str
    is_active: bool
