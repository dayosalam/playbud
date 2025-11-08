from __future__ import annotations

import json
from pathlib import Path
from typing import Any, List, Optional

from pydantic import BaseModel

from supabase import Client

from .supabase_client import get_supabase_client
from ..schemas.metadata import City, LookupItem, ReferenceData

DATA_DIR = Path(__file__).resolve().parent.parent / "storage"
DATA_DIR.mkdir(parents=True, exist_ok=True)
REFERENCE_FILE = DATA_DIR / "reference_data.json"

DEFAULT_REFERENCE_DATA: dict[str, Any] = {
    "cities": [
        {
            "id": "city-abuja",
            "name": "Abuja",
            "slug": "Abuja",
            "center_lat": 9.0579,
            "center_lng": 7.4951,
            "radius_km": 35,
        },
        {
            "id": "city-lagos",
            "name": "Lagos",
            "slug": "Lagos",
            "center_lat": 6.5244,
            "center_lng": 3.3792,
            "radius_km": 30,
        },
        {
            "id": "city-ilorin",
            "name": "Ilorin",
            "slug": "Ilorin",
            "center_lat": 8.4966,
            "center_lng": 4.5426,
            "radius_km": 35,
        },
    ],
    "sports": [
        {"id": "sport-football", "name": "Football", "slug": "football", "code": "FOOTBALL"},
        {"id": "sport-basketball", "name": "Basketball", "slug": "basketball", "code": "BASKETBALL"},
        {"id": "sport-volleyball", "name": "Volleyball", "slug": "volleyball", "code": "VOLLEYBALL"},
        {"id": "sport-flagfootball", "name": "Flag Football", "slug": "flagfootball", "code": "FLAGFOOTBALL"},
        {"id": "sport-badminton", "name": "Badminton", "slug": "badminton", "code": "BADMINTON"},
        {"id": "sport-tennis", "name": "Tennis", "slug": "tennis", "code": "TENNIS"},
        {"id": "sport-dodgeball", "name": "Dodgeball", "slug": "dodgeball", "code": "DODGEBALL"},
        {"id": "sport-squash", "name": "Squash", "slug": "squash", "code": "SQUASH"},
        {"id": "sport-cricket", "name": "Cricket", "slug": "cricket", "code": "CRICKET"},
        {"id": "sport-golf", "name": "Golf", "slug": "golf", "code": "GOLF"},
        {"id": "sport-rugby", "name": "Rugby", "slug": "rugby", "code": "RUGBY"},
        {"id": "sport-futsal", "name": "Futsal", "slug": "futsal", "code": "FUTSAL"},
        {"id": "sport-social", "name": "Social", "slug": "social", "code": "SOCIAL"},
    ],
    "abilities": [
        {"id": "ability-beginner", "name": "Beginner", "slug": "beginner"},
        {"id": "ability-lower-intermediate", "name": "Lower Intermediate", "slug": "lower-intermediate"},
        {"id": "ability-mid-intermediate", "name": "Mid Intermediate", "slug": "mid-intermediate"},
        {"id": "ability-upper-intermediate", "name": "Upper Intermediate", "slug": "upper-intermediate"},
        {"id": "ability-advanced", "name": "Advanced", "slug": "advanced"},
        {"id": "ability-mixed", "name": "Mixed", "slug": "mixed"},
    ],
    "genders": [
        {"id": "gender-female", "name": "Female", "slug": "female"},
        {"id": "gender-male", "name": "Male", "slug": "male"},
        {"id": "gender-mixed", "name": "Mixed", "slug": "mixed"},
    ],
}


class ReferenceDataPayload(BaseModel):
    cities: List[City]
    sports: List[LookupItem]
    abilities: List[LookupItem]
    genders: List[LookupItem]


def _write_reference_file(payload: dict[str, Any]) -> None:
    REFERENCE_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def _load_reference_file() -> ReferenceData:
    if not REFERENCE_FILE.exists():
        _write_reference_file(DEFAULT_REFERENCE_DATA)
        return ReferenceData(**DEFAULT_REFERENCE_DATA)

    with REFERENCE_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    try:
        parsed = ReferenceDataPayload(**data)
    except Exception:
        # fall back to defaults if stored data is invalid
        _write_reference_file(DEFAULT_REFERENCE_DATA)
        return ReferenceData(**DEFAULT_REFERENCE_DATA)

    return ReferenceData(
        cities=parsed.cities,
        sports=parsed.sports,
        abilities=parsed.abilities,
        genders=parsed.genders,
    )


def _map_city(row: dict[str, Any]) -> Optional[City]:
    name = row.get("name")
    slug = row.get("slug") or (name.lower().replace(" ", "-") if isinstance(name, str) else None)
    if not name or not slug:
        return None

    try:
        center_lat = float(row.get("center_lat", 0))
        center_lng = float(row.get("center_lng", 0))
        radius_km = float(row.get("radius_km", 0))
    except (TypeError, ValueError):
        center_lat, center_lng, radius_km = 0.0, 0.0, 0.0

    return City(
        id=str(row.get("id") or slug),
        name=name,
        slug=slug,
        center_lat=center_lat,
        center_lng=center_lng,
        radius_km=radius_km,
    )


def _map_lookup(row: dict[str, Any]) -> Optional[LookupItem]:
    name = row.get("name")
    slug = row.get("slug") or (name.lower().replace(" ", "-") if isinstance(name, str) else None)
    if not name or not slug:
        return None

    return LookupItem(
        id=str(row.get("id") or slug),
        name=name,
        slug=slug,
        code=row.get("code"),
    )


def _fetch_from_supabase(client: Client) -> Optional[ReferenceData]:
    try:
        cities_resp = client.table("cities").select("*").order("name").execute()
        sports_resp = client.table("sports").select("*").order("name").execute()
        abilities_resp = client.table("abilities").select("*").order("name").execute()
        genders_resp = client.table("genders").select("*").order("name").execute()
    except Exception:
        return None

    cities = [
        city for item in (cities_resp.data or []) if (city := _map_city(item)) is not None
    ]
    sports = [
        sport for item in (sports_resp.data or []) if (sport := _map_lookup(item)) is not None
    ]
    abilities = [
        ability for item in (abilities_resp.data or []) if (ability := _map_lookup(item)) is not None
    ]
    genders = [
        gender for item in (genders_resp.data or []) if (gender := _map_lookup(item)) is not None
    ]

    if not cities or not sports or not abilities or not genders:
        return None

    payload = ReferenceData(
        cities=cities,
        sports=sports,
        abilities=abilities,
        genders=genders,
    )

    _write_reference_file(payload.dict())
    return payload


def get_reference_data() -> ReferenceData:
    client = get_supabase_client()
    if client:
        data = _fetch_from_supabase(client)
        if data:
            return data

    return _load_reference_file()
