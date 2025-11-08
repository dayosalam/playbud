from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr

from .games import Game
from .organizers import Organizer
from .bookings import BookingParticipant


class AdminUserInfo(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None
    avatar_url: str | None = None
    preferred_city: str | None = None
    heard_about: str | None = None
    organiser_id: str | None = None
    created_at: datetime | None = None


class AdminGameDetail(BaseModel):
    game: Game
    creator: AdminUserInfo | None = None
    organizer: Organizer | None = None
    participants: list[BookingParticipant] = []
