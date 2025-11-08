from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class OrganizerCreate(BaseModel):
    user_id: str = Field(..., description="ID of the user becoming an organiser")
    slug: str | None = Field(default=None, max_length=120)
    sports: list[str] = Field(default_factory=list, description="Sports the organiser wants to host")
    experience: str | None = Field(default=None, max_length=2000, description="Experience running games")
    unique_link: str | None = Field(default=None, max_length=255, description="Unique public organiser link")


class Organizer(BaseModel):
    id: str
    user_id: str
    slug: str | None = None
    sports: list[str] = Field(default_factory=list)
    experience: str | None = None
    unique_link: str | None = None
    game_ids: list[str] = Field(default_factory=list)
    created_at: datetime
