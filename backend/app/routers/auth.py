from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ..schemas.auth import (
    PasswordResetRequest,
    UserCreate,
    UserLogin,
    TokenResponse,
    UserBase,
    EmailCheckRequest,
    SignupInviteRequest,
    VerificationEmailRequest,
    WhatsappTokenRequest,
    GoogleAuthRequest,
)
from ..services import auth_service, user_repository, email_service
from ..core import security
from ..core.security import get_subject_from_token, TokenDecodeError
from ..core.config import get_settings


router = APIRouter()
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: UserCreate) -> TokenResponse:
    return auth_service.signup(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin) -> TokenResponse:
    return auth_service.login(payload)


@router.post("/google", response_model=TokenResponse)
async def google_login(payload: GoogleAuthRequest) -> TokenResponse:
    return auth_service.login_with_google(payload)


def _get_current_user(token: str = Depends(oauth2_scheme)) -> UserBase:
    try:
        user_id = get_subject_from_token(token)
    except TokenDecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    return auth_service.get_user(user_id)


@router.get("/me", response_model=UserBase)
async def get_me(current_user: UserBase = Depends(_get_current_user)) -> UserBase:
    return current_user


@router.post("/forgot-password")
async def forgot_password(payload: PasswordResetRequest) -> dict[str, str]:
    auth_service.request_password_reset(payload.email)
    return {"message": "If an account exists, you'll get an email shortly."}


@router.post("/whatsapp/check-email")
async def whatsapp_check_email(payload: EmailCheckRequest) -> dict[str, bool]:
    record = user_repository.get_user_by_email(payload.email)
    return {"exists": record is not None}


@router.post("/whatsapp/signup-invite")
async def whatsapp_signup_invite(payload: SignupInviteRequest) -> dict[str, bool]:
    print(f"[whatsapp] signup invite requested for {payload.email}")
    sent = email_service.send_whatsapp_signup_email(recipient=payload.email, link=settings.signup_url)
    if not sent:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to send email")
    return {"sent": True}


@router.post("/whatsapp/verification-email")
async def whatsapp_verification_email(payload: VerificationEmailRequest) -> dict[str, bool]:
    record = user_repository.get_user_by_email(payload.email)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    sent = email_service.send_whatsapp_verification_email(recipient=payload.email, token=payload.token)
    if not sent:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to send email")
    return {"sent": True}


@router.post("/whatsapp/token", response_model=TokenResponse)
async def whatsapp_token(payload: WhatsappTokenRequest) -> TokenResponse:
    if not settings.whatsapp_bot_secret or payload.secret != settings.whatsapp_bot_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    record = user_repository.get_user_by_email(payload.email)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    access_token = security.create_access_token(record.id)
    refresh_token = security.create_refresh_token(record.id)
    user = auth_service.get_user(record.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )
