from datetime import datetime, timedelta
from typing import Dict, Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
ALGORITHM = "HS256" 


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _create_token(data: Dict[str, Any], expires_delta: timedelta, secret_key: str) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires = timedelta(minutes=settings.jwt_access_token_expires_minutes)
    return _create_token({"sub": subject}, expires, settings.jwt_secret_key)


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    expires = timedelta(minutes=settings.jwt_refresh_token_expires_minutes)
    return _create_token({"sub": subject}, expires, settings.jwt_refresh_secret_key)


def decode_access_token(token: str) -> Dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])


def decode_refresh_token(token: str) -> Dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_refresh_secret_key, algorithms=[ALGORITHM])


class TokenDecodeError(Exception):
    """Raised when a JWT cannot be decoded."""


def get_subject_from_token(token: str, refresh: bool = False) -> str:
    try:
        payload = decode_refresh_token(token) if refresh else decode_access_token(token)
    except JWTError as exc:
        raise TokenDecodeError(str(exc)) from exc
    subject = payload.get("sub")
    if subject is None:
        raise TokenDecodeError("Token subject missing")
    return subject
