from pydantic import BaseModel, EmailStr, Field
from typing import Literal
from uuid import UUID


class DoctorRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    hospital: str | None = None


class LoginRequest(BaseModel):
    role: Literal["doctor", "patient"]
    email: EmailStr | None = None
    username: str | None = None
    password: str


class ActivateInviteRequest(BaseModel):
    invite_code: str
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserOut(BaseModel):
    id: UUID
    username: str | None
    role: str
    is_active: bool

    class Config:
        from_attributes = True
