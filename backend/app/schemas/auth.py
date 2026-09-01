from pydantic import BaseModel, EmailStr, Field


class DoctorRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    hospital: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
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
    id: str
    username: str | None
    role: str
    is_active: bool

    class Config:
        from_attributes = True
