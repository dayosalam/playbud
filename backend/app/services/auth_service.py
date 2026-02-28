from fastapi import HTTPException, status
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from uuid import uuid4

from ..core import security
from ..core.config import get_settings
from ..schemas.auth import PasswordResetRequest, UserCreate, UserLogin, TokenResponse, UserBase, GoogleAuthRequest
from . import user_repository, email_service

settings = get_settings()


def _user_to_response(record: user_repository.UserRecord) -> UserBase:
    return UserBase(
        id=record.id,
        email=record.email,
        name=record.name,
        avatar_url=record.avatar_url,
        created_at=record.created_at,
        preferred_city=record.preferred_city,
        heard_about=record.heard_about,
        organiser_id=record.organiser_id,
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

    response = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_to_response(record),
    )
    try:
        sent = email_service.send_welcome_email(recipient=record.email, name=record.name)
        if not sent:
            print("⚠️  Welcome email not sent (check SMTP settings).")
    except Exception as exc:  # noqa: BLE001
        print(f"⚠️  Welcome email failed: {exc}")
    return response





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


def _verify_google_id_token(id_token: str) -> dict:
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google login is not configured.",
        )
    try:
        return google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        ) from None


def login_with_google(payload: GoogleAuthRequest) -> TokenResponse:
    claims = _verify_google_id_token(payload.id_token)
    email = claims.get("email")
    if not email or not claims.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email is not verified",
        )

    name = claims.get("name") or email.split("@")[0]
    avatar_url = claims.get("picture")

    record = user_repository.get_user_by_email(email)
    if not record:
        record = user_repository.create_user(
            email=email,
            password_hash=security.hash_password(str(uuid4())),
            name=name,
            avatar_url=avatar_url,
            preferred_city=payload.preferred_city,
            heard_about=payload.heard_about,
        )
    else:
        updates = {}
        if name and not record.name:
            updates["name"] = name
        if avatar_url and not record.avatar_url:
            updates["avatar_url"] = avatar_url
        if payload.preferred_city and not record.preferred_city:
            updates["preferred_city"] = payload.preferred_city
        if payload.heard_about and not record.heard_about:
            updates["heard_about"] = payload.heard_about
        if updates:
            record = user_repository.update_user_fields(record.id, updates)

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


def request_password_reset(email: str) -> None:
    record = user_repository.get_user_by_email(email)
    if not record:
        return

    from ..services.supabase_client import get_supabase_client
    client = get_supabase_client()
    if client is None:
        return
    client.auth.reset_password_for_email(record.email, options={"redirect_to": settings.password_reset_url})
