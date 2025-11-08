"""
Utility script to push existing local JSON storage data into Supabase.

Usage:
    poetry run python -m app.scripts.migrate_local_data

Requirements:
    - SUPABASE_URL and SERVICE_ROLE env vars configured
    - (Optional) SUPABASE_ANON_KEY for completeness, but Service Role suffices
    - The SQL migration (backend/migrations/0001_create_core_tables.sql) applied beforehand
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from supabase import Client

from ..services.supabase_client import get_supabase_client

ROOT_DIR = Path(__file__).resolve().parent.parent / "storage"


def load_json(filename: str) -> list[dict[str, Any]]:
    path = ROOT_DIR / filename
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        try:
            data = json.load(handle)
        except json.JSONDecodeError:
            return []
    if not isinstance(data, list):
        return []
    return data


def normalise_game(record: dict[str, Any]) -> dict[str, Any]:
    record = {**record}
    record.setdefault("participant_user_ids", [])
    record.setdefault("created_at", record.get("created_at") or record.get("date"))
    record.setdefault("updated_at", record.get("updated_at") or record.get("created_at"))
    if record.get("price") is not None:
        try:
            record["price"] = float(record["price"])
        except (TypeError, ValueError):
            record["price"] = None
    return record


def normalise_organizer(record: dict[str, Any]) -> dict[str, Any]:
    record = {**record}
    record.setdefault("sports", [])
    record.setdefault("experience", None)
    record.setdefault("unique_link", None)
    record.setdefault("game_ids", [])
    record.setdefault("created_at", record.get("created_at"))
    return record


def normalise_booking(record: dict[str, Any]) -> dict[str, Any]:
    record = {**record}
    record.pop("status", None)
    record.pop("payment_status", None)
    record.pop("payment_amount", None)
    record.pop("cancelled_at", None)
    record.setdefault("joined_at", record.get("joined_at"))
    return record


def chunked(iterable: Iterable[dict[str, Any]], size: int = 200) -> Iterable[list[dict[str, Any]]]:
    batch: list[dict[str, Any]] = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def upsert(client: Client, table: str, records: list[dict[str, Any]]) -> None:
    for batch in chunked(records):
        client.table(table).upsert(batch, returning="minimal", on_conflict="id").execute()


def migrate() -> None:
    client = get_supabase_client()
    if not client:
        raise SystemExit("Supabase client is not configured. Check SUPABASE_URL and SERVICE_ROLE env vars.")

    users = load_json("users.json")
    if users:
        print(f"Upserting {len(users)} users...")
        upsert(client, "users", users)
    else:
        print("No local users.json data found.")

    organizers = [normalise_organizer(item) for item in load_json("organizers.json")]
    if organizers:
        print(f"Upserting {len(organizers)} organizers...")
        upsert(client, "organizers", organizers)
    else:
        print("No local organizers.json data found.")

    games = [normalise_game(item) for item in load_json("games.json")]
    if games:
        print(f"Upserting {len(games)} games...")
        upsert(client, "games", games)
    else:
        print("No local games.json data found.")

    bookings_path = ROOT_DIR / "bookings.json"
    if bookings_path.exists():
        bookings = [normalise_booking(item) for item in load_json("bookings.json")]
        if bookings:
            print(f"Upserting {len(bookings)} bookings...")
            upsert(client, "bookings", bookings)
        else:
            print("bookings.json found, but no records populated.")
    else:
        print("No local bookings.json data found (skipping).")

    print("Migration complete.")


if __name__ == "__main__":
    migrate()
