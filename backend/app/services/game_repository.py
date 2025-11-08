from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from supabase import Client

from .supabase_client import get_supabase_client
from ..schemas.games import GameCreate, Game
from ..services.helper import parse_iso_datetime, parse_iso_time

GAMES_TABLE = "games"


def _client() -> Client:
    client = get_supabase_client()
    if client is None:
        raise RuntimeError(
            "Supabase client is not configured. Ensure SUPABASE_URL and SERVICE_ROLE environment variables are set."
        )
    return client


class GameRecord(BaseModel):
    id: str
    organiser_id: Optional[str]
    created_by_user_id: Optional[str] = None
    name: str
    venue: str
    city_slug: str
    sport_code: str
    date: str
    start_time: str
    end_time: str
    skill: str
    gender: str
    players: int
    description: Optional[str]
    rules: Optional[str]
    frequency: str
    price: Optional[float]
    is_private: bool
    cancellation: str
    team_sheet: bool
    status: str = "pending"
    participant_user_ids: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str


def _record_to_game(record: GameRecord) -> Game:
    return Game(
        id=record.id,
        organiser_id=record.organiser_id,
        created_by_user_id=record.created_by_user_id,
        name=record.name,
        venue=record.venue,
        city_slug=record.city_slug,
        sport_code=record.sport_code,
        date=parse_iso_datetime(record.date),
        start_time=parse_iso_time(record.start_time),
        end_time=parse_iso_time(record.end_time),
        skill=record.skill,
        gender=record.gender,
        players=record.players,
        description=record.description,
        rules=record.rules,
        frequency=record.frequency,
        price=record.price,
        is_private=record.is_private,
        cancellation=record.cancellation,
        team_sheet=record.team_sheet,
        status=record.status,  # type: ignore[arg-type]
        participant_user_ids=record.participant_user_ids,
        created_at=parse_iso_datetime(record.created_at),
        updated_at=parse_iso_datetime(record.updated_at),
    )



def _coerce_participant_ids(raw: object) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(value) for value in raw if isinstance(value, (str, int))]
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                return [str(value) for value in data if isinstance(value, (str, int))]
        except (json.JSONDecodeError, TypeError):
            return []
    return []


def _deserialize_supabase_record(item: dict) -> GameRecord:
    return GameRecord(
        id=item["id"],
        organiser_id=item.get("organiser_id"),
        created_by_user_id=item.get("created_by_user_id"),
        name=item["name"],
        venue=item["venue"],
        city_slug=item["city_slug"],
        sport_code=item["sport_code"],
        date=item["date"],
        start_time=item["start_time"],
        end_time=item["end_time"],
        skill=item["skill"],
        gender=item["gender"],
        players=item["players"],
        description=item.get("description"),
        rules=item.get("rules"),
        frequency=item["frequency"],
        price=item.get("price"),
        is_private=item["is_private"],
        cancellation=item["cancellation"],
        team_sheet=item["team_sheet"],
        participant_user_ids=_coerce_participant_ids(item.get("participant_user_ids")),
        status=item.get("status", "pending"),
        created_at=item["created_at"],
        updated_at=item["updated_at"],
    )


def _load_games() -> List[GameRecord]:
    client = _client()
    response = client.table(GAMES_TABLE).select("*").execute()
    games = response.data or []
    return [_deserialize_supabase_record(item) for item in games]


def create_game(payload: GameCreate) -> Game:
    now = datetime.utcnow()
    record = GameRecord(
        id=str(uuid4()),
        organiser_id=payload.organiser_id,
        created_by_user_id=payload.created_by_user_id,
        name=payload.name,
        venue=payload.venue,
        city_slug=payload.city_slug,
        sport_code=payload.sport_code,
        date=payload.date.isoformat(),
        start_time=payload.start_time.isoformat(),
        end_time=payload.end_time.isoformat(),
        skill=payload.skill,
        gender=payload.gender,
        players=payload.players,
        description=payload.description,
        rules=payload.rules,
        frequency=payload.frequency,
        price=payload.price,
        is_private=payload.is_private,
        cancellation=payload.cancellation,
        team_sheet=payload.team_sheet,
        participant_user_ids=list(payload.participant_user_ids or []),
        status=payload.status,
        created_at=now.isoformat(),
        updated_at=now.isoformat(),
    )

    client = _client()
    client.table(GAMES_TABLE).insert(record.dict()).execute()

    return _record_to_game(record)


def get_game(game_id: str) -> Optional[Game]:
    client = _client()
    response = (
        client.table(GAMES_TABLE)
        .select("*")
        .eq("id", game_id)
        .limit(1)
        .execute()
    )
    data = response.data or []
    if data:
        return _record_to_game(_deserialize_supabase_record(data[0]))
    return None


def list_games(limit: int = 50) -> List[Game]:
    records = _load_games()
    records = sorted(records, key=lambda r: r.created_at, reverse=True)[:limit]
    return [_record_to_game(record) for record in records]


def update_participant_user_ids(game_id: str, participant_ids: list[str]) -> None:
    client = _client()
    now = datetime.utcnow().isoformat()
    client.table(GAMES_TABLE).update(
        {"participant_user_ids": participant_ids, "updated_at": now}
    ).eq("id", game_id).execute()


def update_game_status(game_id: str, status: str) -> Optional[Game]:
    client = _client()
    now = datetime.utcnow().isoformat()
    response = (
        client.table(GAMES_TABLE)
        .update({"status": status, "updated_at": now})
        .eq("id", game_id)
        .execute()
    )
    data = response.data or []
    if not data:
        return None
    return _record_to_game(_deserialize_supabase_record(data[0]))
