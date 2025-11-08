from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel
from postgrest.exceptions import APIError
from supabase import Client

from .supabase_client import get_supabase_client
from ..schemas.bookings import Booking

BOOKINGS_TABLE = "bookings"


def _client() -> Client:
    client = get_supabase_client()
    if client is None:
        raise RuntimeError(
            "Supabase client is not configured. Ensure SUPABASE_URL and SERVICE_ROLE environment variables are set."
        )
    return client


class BookingRecord(BaseModel):
    id: str
    game_id: str
    user_id: str
    joined_at: str
    notes: str | None = None

    class Config:
        extra = "ignore"


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    value = value.replace("Z", "+00:00")
    return datetime.fromisoformat(value)


def _record_to_booking(record: BookingRecord) -> Booking:
    joined_at = _parse_datetime(record.joined_at) or datetime.utcnow()
    return Booking(
        id=record.id,
        game_id=record.game_id,
        user_id=record.user_id,
        joined_at=joined_at,
        notes=record.notes,
    )


def create_booking(
    game_id: str,
    user_id: str,
    *,
    notes: str | None = None,
) -> Booking:
    now_iso = datetime.utcnow().isoformat()
    record = BookingRecord(
        id=str(uuid4()),
        game_id=game_id,
        user_id=user_id,
        joined_at=now_iso,
        notes=notes,
    )

    payload = record.dict()
    client = _client()
    try:
        client.table(BOOKINGS_TABLE).insert(payload).execute()
    except APIError as exc:
        message = exc.message or ""
        legacy_keys = ("status", "payment_status", "payment_amount", "cancelled_at")
        if any(key in message for key in legacy_keys):
            legacy_payload = {
                **payload,
                "status": "confirmed",
                "payment_status": None,
                "payment_amount": None,
                "cancelled_at": None,
            }
            client.table(BOOKINGS_TABLE).insert(legacy_payload).execute()
        else:
            raise
    return _record_to_booking(record)


def get_booking(game_id: str, user_id: str) -> Optional[Booking]:
    client = _client()
    response = (
        client.table(BOOKINGS_TABLE)
        .select("*")
        .eq("game_id", game_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    data = response.data or []
    if not data:
        return None
    return _record_to_booking(BookingRecord(**data[0]))


def get_booking_by_id(booking_id: str) -> Optional[Booking]:
    client = _client()
    response = (
        client.table(BOOKINGS_TABLE)
        .select("*")
        .eq("id", booking_id)
        .limit(1)
        .execute()
    )
    data = response.data or []
    if not data:
        return None
    return _record_to_booking(BookingRecord(**data[0]))


def count_active_bookings(game_id: str) -> int:
    client = _client()
    response = (
        client.table(BOOKINGS_TABLE)
        .select("id", count="exact", head=True)
        .eq("game_id", game_id)
        .execute()
    )
    return response.count or 0


def delete_booking(booking_id: str) -> Optional[Booking]:
    client = _client()
    booking = get_booking_by_id(booking_id)
    if not booking:
        return None
    try:
        client.table(BOOKINGS_TABLE).delete().eq("id", booking_id).execute()
    except APIError as exc:
        raise RuntimeError(f"Failed to delete booking {booking_id}: {exc.message}") from exc
    return booking


def get_user_bookings(user_id: str) -> List[Booking]:
    client = _client()
    response = (
        client.table(BOOKINGS_TABLE)
        .select("*")
        .eq("user_id", user_id)
        .order("joined_at", desc=True)
        .execute()
    )
    data = response.data or []
    return [_record_to_booking(BookingRecord(**item)) for item in data]


def get_game_participants(game_id: str) -> List[Booking]:
    client = _client()
    response = (
        client.table(BOOKINGS_TABLE)
        .select("*")
        .eq("game_id", game_id)
        .order("joined_at")
        .execute()
    )
    data = response.data or []
    return [_record_to_booking(BookingRecord(**item)) for item in data]
