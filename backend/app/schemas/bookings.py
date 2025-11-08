from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from pydantic import BaseModel, Field

class BookingCreate(BaseModel):
    game_id: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


class Booking(BaseModel):
    id: str
    game_id: str
    user_id: str
    joined_at: datetime
    notes: Optional[str] = None


class BookingResponse(Booking):
    ...


if TYPE_CHECKING:
    from .games import Game


class GameWithBooking(BaseModel):
    game: "Game"
    booking: BookingResponse
    participants_count: int


class ParticipantUser(BaseModel):
    id: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class BookingParticipant(BaseModel):
    booking_id: str
    user: ParticipantUser
    joined_at: datetime


from .games import Game  # noqa: E402  # isort:skip
