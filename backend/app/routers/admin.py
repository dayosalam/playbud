from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel

from ..schemas.auth import UserBase
from ..schemas.games import Game
from ..schemas.admin import AdminGameDetail, AdminUserInfo
from ..schemas.bookings import BookingParticipant, ParticipantUser
from ..schemas.organizers import Organizer
from ..core.config import get_settings, admin_email_set
from .auth import _get_current_user
from ..services import (
    game_service,
    user_repository,
    organizer_repository,
    booking_repository,
)


router = APIRouter()

settings = get_settings()
ADMIN_EMAILS = admin_email_set(settings)


def _to_admin_user(record) -> AdminUserInfo | None:
    if not record:
        return None
    return AdminUserInfo(
        id=record.id,
        email=record.email,
        name=record.name,
        avatar_url=record.avatar_url,
        preferred_city=record.preferred_city,
        heard_about=record.heard_about,
        organiser_id=record.organiser_id,
        created_at=record.created_at,
    )


def _require_admin(current_user: UserBase = Depends(_get_current_user)) -> UserBase:
    if current_user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    return current_user


@router.get("/admin/games", response_model=list[Game])
def list_all_games(
    status_filter: str | None = Query(None, alias="status"),
    _: UserBase = Depends(_require_admin),
) -> list[Game]:
    return game_service.list_recent_games(limit=500, status_filter=status_filter)


class GameStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "unapproved", "completed"]


@router.patch("/admin/games/{game_id}/status", response_model=Game)
def change_game_status(
    game_id: str = Path(...),
    payload: GameStatusUpdate = ...,
    _: UserBase = Depends(_require_admin),
) -> Game:
    updated = game_service.update_game_status(game_id, payload.status)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    return updated


@router.get("/admin/games/{game_id}", response_model=AdminGameDetail)
def get_game_detail(
    game_id: str,
    _: UserBase = Depends(_require_admin),
) -> AdminGameDetail:
    game = game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

    creator_record = None
    if game.created_by_user_id:
        creator_record = user_repository.get_user_by_id(game.created_by_user_id)

    organizer_obj = None
    if game.organiser_id:
        organizer_record = organizer_repository.get_by_id(game.organiser_id)
        if organizer_record:
            organizer_obj = Organizer(**organizer_record.dict())

    bookings = booking_repository.get_game_participants(game_id)
    participants: list[BookingParticipant] = []
    for booking in bookings:
        user = user_repository.get_user_by_id(booking.user_id)
        participants.append(
            BookingParticipant(
                booking_id=booking.id,
                user=ParticipantUser(
                    id=booking.user_id,
                    name=user.name if user else None,
                    avatar_url=user.avatar_url if user else None,
                ),
                joined_at=booking.joined_at,
            )
        )

    return AdminGameDetail(
        game=game,
        creator=_to_admin_user(creator_record),
        organizer=organizer_obj,
        participants=participants,
    )
