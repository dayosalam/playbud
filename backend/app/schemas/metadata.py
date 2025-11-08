from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class City(BaseModel):
    id: str
    name: str
    slug: str
    center_lat: float
    center_lng: float
    radius_km: float


class LookupItem(BaseModel):
    id: str
    name: str
    slug: str
    code: Optional[str] = None


class ReferenceData(BaseModel):
    cities: list[City]
    sports: list[LookupItem]
    abilities: list[LookupItem]
    genders: list[LookupItem]
