from fastapi import HTTPException, status

from ..core import security
from ..schemas.auth import UserCreate, UserLogin, TokenResponse, UserBase
from . import user_repository


def _user_to_response(record: user_repository.UserRecord) -> UserBase:
    return UserBase(
        id=record.id,
        email=record.email,
        name=record.name,
        avatar_url=record.avatar_url,
        created_at=record.created_at,
        preferred_city=record.preferred_city,
        heard_about=record.heard_about,
    )


def signup(payload: UserCreate) -> TokenResponse:
    existing = user_repository.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    password_hash = security.hash_password(payload.password)
    record = user_repository.create_user(
        email=payload.email,
        password_hash=password_hash,
        name=payload.name,
        preferred_city=payload.preferred_city,
        heard_about=payload.heard_about,
    )

    access_token = security.create_access_token(record.id)
    refresh_token = security.create_refresh_token(record.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_to_response(record),
    )


def login(payload: UserLogin) -> TokenResponse:
    record = user_repository.get_user_by_email(payload.email)
    if not record or not security.verify_password(payload.password, record.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = security.create_access_token(record.id)
    refresh_token = security.create_refresh_token(record.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_to_response(record),
    )


def get_user(user_id: str) -> UserBase:
    record = user_repository.get_user_by_id(user_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_to_response(record)
