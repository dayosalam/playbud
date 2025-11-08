from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from pydantic import BaseModel, Field
from postgrest.exceptions import APIError
from supabase import Client

from .supabase_client import get_supabase_client

ORGANIZERS_TABLE = "organizers"


def _client() -> Client:
    client = get_supabase_client()
    if client is None:
        raise RuntimeError(
            "Supabase client is not configured. Ensure SUPABASE_URL and SERVICE_ROLE environment variables are set."
        )
    return client


class OrganizerRecord(BaseModel):
    id: str
    user_id: str
    slug: str | None = None
    created_at: datetime
    sports: list[str] = Field(default_factory=list)
    experience: str | None = None
    unique_link: str | None = None
    game_ids: list[str] = Field(default_factory=list)


def _coerce_list(raw: object) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(item).strip() for item in raw if str(item).strip()]
    return [part.strip() for part in str(raw).split(",") if part.strip()]


def _record_from_row(row: dict) -> OrganizerRecord:
    created_at = row.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    elif created_at is None:
        created_at = datetime.utcnow()
    return OrganizerRecord(
        id=row["id"],
        user_id=row["user_id"],
        slug=row.get("slug"),
        created_at=created_at,
        sports=_coerce_list(row.get("sports")),
        experience=row.get("experience"),
        unique_link=row.get("unique_link"),
        game_ids=_coerce_list(row.get("game_ids")),
    )


def get_by_user_id(user_id: str) -> Optional[OrganizerRecord]:
    client = _client()
    response = client.table(ORGANIZERS_TABLE).select("*").eq("user_id", user_id).limit(1).execute()
    data = response.data or []
    if not data:
        return None
    return _record_from_row(data[0])


def get_by_id(organizer_id: str) -> Optional[OrganizerRecord]:
    client = _client()
    response = client.table(ORGANIZERS_TABLE).select("*").eq("id", organizer_id).limit(1).execute()
    data = response.data or []
    if not data:
        return None
    return _record_from_row(data[0])


def create(
    user_id: str,
    slug: str | None = None,
    sports: list[str] | None = None,
    experience: str | None = None,
    unique_link: str | None = None,
) -> OrganizerRecord:
    client = _client()

    existing = get_by_user_id(user_id)
    normalized_sports = [sport.strip() for sport in (sports or []) if sport.strip()]
    experience_value = experience.strip() if isinstance(experience, str) else experience
    unique_link_value = unique_link.strip() if isinstance(unique_link, str) else unique_link

    if existing:
        updates: dict[str, object] = {}
        if slug and slug != existing.slug:
            updates["slug"] = slug
        if sports is not None and normalized_sports != existing.sports:
            updates["sports"] = normalized_sports
        if experience is not None and experience_value != existing.experience:
            updates["experience"] = experience_value
        if unique_link is not None and unique_link_value != existing.unique_link:
            updates["unique_link"] = unique_link_value

        if updates:
            try:
                client.table(ORGANIZERS_TABLE).update(updates).eq("id", existing.id).execute()
            except APIError as exc:
                raise RuntimeError(f"Failed to update organizer {existing.id}: {exc.message}") from exc
        return get_by_id(existing.id) or existing

    record = OrganizerRecord(
        id=str(uuid4()),
        user_id=user_id,
        slug=slug,
        created_at=datetime.utcnow(),
        sports=normalized_sports,
        experience=experience_value,
        unique_link=unique_link_value,
        game_ids=[],
    )

    client.table(ORGANIZERS_TABLE).insert(
        {
            "id": record.id,
            "user_id": record.user_id,
            "slug": record.slug,
            "sports": record.sports,
            "experience": record.experience,
            "unique_link": record.unique_link,
            "created_at": record.created_at.isoformat(),
        }
    ).execute()

    return record


def append_game(organizer_id: str, game_id: str) -> Optional[OrganizerRecord]:
    client = _client()
    organizer = get_by_id(organizer_id)
    if not organizer:
        return None

    if game_id in organizer.game_ids:
        return organizer

    updated_ids = [*organizer.game_ids, game_id]
    try:
        client.table(ORGANIZERS_TABLE).update({"game_ids": updated_ids}).eq("id", organizer_id).execute()
    except APIError as exc:
        raise RuntimeError(f"Failed to append game to organizer {organizer_id}: {exc.message}") from exc

    organizer.game_ids = updated_ids
    return organizer
