from functools import lru_cache
from pathlib import Path
from pydantic.v1 import BaseSettings, Field, ValidationError

from dotenv import load_dotenv

ENV_PATH = Path("/Users/dayosalam/Documents/codes/playbud/backend/.env")
load_dotenv(dotenv_path=ENV_PATH, override=True)  # force using file values


class Settings(BaseSettings):
    api_title: str = "PlayBud API"
    api_version: str = "0.1.0"

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:2121"])
    admin_emails_raw: str = Field("", env="ADMIN_EMAILS")

    supabase_url: str = Field("", env="SUPABASE_URL")
    supabase_service_role_key: str = Field("", env="SERVICE_ROLE")

    jwt_secret_key: str = Field("dev-access-secret", env="JWT_SECRET_KEY")
    jwt_refresh_secret_key: str = Field("dev-refresh-secret", env="JWT_REFRESH_SECRET_KEY")
    jwt_access_token_expires_minutes: int = 60
    jwt_refresh_token_expires_minutes: int = 60 * 24 * 7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"



@lru_cache
def get_settings() -> Settings:
    try:
        s = Settings()
    except ValidationError as e:
        missing = [ ".".join(map(str, err["loc"])) for err in e.errors() if err["type"]=="value_error.missing"]
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}") from e

    # Quick debug (safe prefixes)
    print(f"ENV path exists: {ENV_PATH.exists()} ({ENV_PATH})")
    print(f"✅ Supabase URL: {s.supabase_url}")
    print(f"✅ Service Role Key: {s.supabase_service_role_key[:6]}********" if s.supabase_service_role_key else "❌ Service Role Key: MISSING")
    print(f"✅ JWT Access Secret: {s.jwt_secret_key[:6]}********")
    return s


def admin_email_set(settings: Settings) -> set[str]:
    return {
        email.strip().lower()
        for email in settings.admin_emails_raw.split(",")
        if email.strip()
    }
