from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    id: str
    email: EmailStr
    name: str
    avatar_url: str | None = None
    created_at: datetime | None = None
    preferred_city: str | None = None
    heard_about: str | None = None
    organiser_id: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    preferred_city: str | None = None
    heard_about: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserBase


class PasswordResetRequest(BaseModel):
    email: EmailStr


class EmailCheckRequest(BaseModel):
    email: EmailStr


class SignupInviteRequest(BaseModel):
    email: EmailStr


class VerificationEmailRequest(BaseModel):
    email: EmailStr
    token: str


class WhatsappTokenRequest(BaseModel):
    email: EmailStr
    secret: str


class GoogleAuthRequest(BaseModel):
    id_token: str
    preferred_city: str | None = None
    heard_about: str | None = None
