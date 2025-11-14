from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ..schemas.auth import PasswordResetRequest, UserCreate, UserLogin, TokenResponse, UserBase
from ..services import auth_service
from ..core.security import get_subject_from_token, TokenDecodeError


router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: UserCreate) -> TokenResponse:
    return auth_service.signup(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin) -> TokenResponse:
    return auth_service.login(payload)


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
