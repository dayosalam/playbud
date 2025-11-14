from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from pydantic import BaseModel, EmailStr
from postgrest.exceptions import APIError
from supabase import Client

from .supabase_client import get_supabase_client
from .helper import parse_iso_datetime

USERS_TABLE = "users"


def _client() -> Client:
    client = get_supabase_client()
    if client is None:
        raise RuntimeError(
            "Supabase client is not configured. Ensure SUPABASE_URL and SERVICE_ROLE environment variables are set."
        )
    return client


class UserRecord(BaseModel):
    id: str
    email: EmailStr
    name: str
    password_hash: str
    avatar_url: str | None = None
    organiser_id: str | None = None
    preferred_city: str | None = None
    heard_about: str | None = None
    created_at: datetime


def _parse_user(row: dict) -> UserRecord:
    created_at = row.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = parse_iso_datetime(created_at)
        except ValueError:
            created_at = datetime.utcnow()
    elif created_at is None:
        created_at = datetime.utcnow()
    return UserRecord(
        id=row["id"],
        email=row["email"],
        name=row.get("name", ""),
        password_hash=row["password_hash"],
        avatar_url=row.get("avatar_url"),
        organiser_id=row.get("organiser_id"),
        preferred_city=row.get("preferred_city"),
        heard_about=row.get("heard_about"),
        created_at=created_at,
    )


def _ensure_organiser_id(record: UserRecord) -> UserRecord:
    if record.organiser_id:
        return record
    organiser_id = str(uuid4())
    client = _client()
    client.table(USERS_TABLE).update({"organiser_id": organiser_id}).eq("id", record.id).execute()
    record.organiser_id = organiser_id
    return record


def get_user_by_email(email: str) -> Optional[UserRecord]:
    client = _client()
    response = client.table(USERS_TABLE).select("*").eq("email", email).limit(1).execute()
    data = response.data or []
    if not data:
        return None
    return _ensure_organiser_id(_parse_user(data[0]))


def get_user_by_id(user_id: str) -> Optional[UserRecord]:
    client = _client()
    response = client.table(USERS_TABLE).select("*").eq("id", user_id).limit(1).execute()
    data = response.data or []
    if not data:
        return None
    return _ensure_organiser_id(_parse_user(data[0]))


def create_user(
    *,
    email: str,
    password_hash: str,
    name: str,
    preferred_city: str | None = None,
    heard_about: str | None = None,
) -> UserRecord:
    client = _client()
    organiser_id = str(uuid4())
    record = UserRecord(
        id=str(uuid4()),
        email=email,
        name=name,
        password_hash=password_hash,
        organiser_id=organiser_id,
        preferred_city=preferred_city,
        heard_about=heard_about,
        created_at=datetime.utcnow(),
    )
    try:
        client.table(USERS_TABLE).insert(
            {
                "id": record.id,
                "email": record.email,
                "name": record.name,
                "password_hash": record.password_hash,
                "avatar_url": record.avatar_url,
                "organiser_id": record.organiser_id,
                "preferred_city": record.preferred_city,
                "heard_about": record.heard_about,
                "created_at": record.created_at.isoformat(),
            }
        ).execute()
    except APIError as exc:
        raise RuntimeError(f"Failed to create user: {exc.message}") from exc
    return record


def list_users() -> List[UserRecord]:
    client = _client()
    response = client.table(USERS_TABLE).select("*").execute()
    data = response.data or []
    return [_parse_user(item) for item in data]


def get_users_by_ids(user_ids: List[str]) -> List[UserRecord]:
    if not user_ids:
        return []

    client = _client()
    response = client.table(USERS_TABLE).select("*").in_("id", list(set(user_ids))).execute()
    data = response.data or []
    return [_ensure_organiser_id(_parse_user(item)) for item in data]
