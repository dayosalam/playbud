from __future__ import annotations

from datetime import datetime, time
from typing import Literal, Optional

from pydantic import BaseModel, Field, constr


class GameParticipant(BaseModel):
    id: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class GameCreate(BaseModel):
    organiser_id: str = Field(..., description="ID of the organiser")
    name: constr(min_length=1, max_length=200)
    venue: constr(min_length=1, max_length=255)
    city_slug: constr(min_length=1, max_length=80)
    sport_code: constr(min_length=1, max_length=40)
    date: datetime
    start_time: time
    end_time: time
    skill: constr(min_length=1, max_length=80)
    gender: Literal["Male", "Female", "Mixed"]
    players: int = Field(gt=0, le=200)
    description: Optional[str] = Field(default=None)
    rules: Optional[str] = Field(default=None)
    frequency: Literal["one-off", "recurring"]
    price: Optional[float] = Field(default=None, ge=0)
    is_private: bool = False
    cancellation: constr(min_length=1, max_length=80) = "24 Hours"
    team_sheet: bool = True
    status: Literal["pending", "confirmed", "unapproved", "completed"] = "pending"
    participant_user_ids: list[str] = Field(default_factory=list)
    created_by_user_id: Optional[str] = None


class Game(BaseModel):
    id: str
    organiser_id: Optional[str]
    created_by_user_id: Optional[str]
    name: str
    venue: str
    city_slug: str
    sport_code: str
    date: datetime
    start_time: time
    end_time: time
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
    status: Literal["pending", "confirmed", "unapproved", "completed"]
    participant_user_ids: list[str] = Field(default_factory=list)
    participants: list[GameParticipant] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
