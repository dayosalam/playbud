from __future__ import annotations

import re

from ..schemas.organizers import Organizer, OrganizerCreate
from . import organizer_repository


def get_or_create(payload: OrganizerCreate) -> Organizer:
    slug = None
    if payload.slug:
        cleaned = re.sub(r"[^a-zA-Z0-9\\-]", "-", payload.slug.strip().lower())
        slug = re.sub(r"-{2,}", "-", cleaned).strip("-") or None
    sports = [sport.strip() for sport in payload.sports if sport.strip()]
    experience = payload.experience.strip() if isinstance(payload.experience, str) else payload.experience
    unique_link = payload.unique_link.strip() if isinstance(payload.unique_link, str) else payload.unique_link
    record = organizer_repository.create(
        payload.user_id,
        slug,
        sports,
        experience,
        unique_link,
    )
    return Organizer(
        id=record.id,
        user_id=record.user_id,
        slug=record.slug,
        sports=record.sports,
        experience=record.experience,
        unique_link=record.unique_link,
        game_ids=record.game_ids,
        created_at=record.created_at,
    )


def get_by_user_id(user_id: str) -> Organizer | None:
    record = organizer_repository.get_by_user_id(user_id)
    if not record:
        return None
    return Organizer(
        id=record.id,
        user_id=record.user_id,
        slug=record.slug,
        sports=record.sports,
        experience=record.experience,
        unique_link=record.unique_link,
        game_ids=record.game_ids,
        created_at=record.created_at,
    )


def link_game_to_organizer(organizer_id: str, game_id: str) -> None:
    organizer_repository.append_game(organizer_id, game_id)
