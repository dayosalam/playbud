from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas.auth import UserBase
from ..schemas.bookings import (
    BookingCreate,
    BookingParticipant,
    BookingResponse,
    GameWithBooking,
    ParticipantUser,
)
from ..services import booking_service, user_repository
from .auth import _get_current_user

router = APIRouter()


@router.post("/games/{game_id}/join", response_model=BookingResponse)
def join_game_endpoint(
    game_id: str,
    payload: BookingCreate,
    current_user: UserBase = Depends(_get_current_user),
) -> BookingResponse:
    try:
        return booking_service.join_game(game_id, current_user.id, payload.notes)
    except booking_service.BookingValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except booking_service.BookingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/bookings/{booking_id}", response_model=BookingResponse)
def cancel_booking_endpoint(
    booking_id: str,
    current_user: UserBase = Depends(_get_current_user),
) -> BookingResponse:
    try:
        return booking_service.cancel_booking(booking_id, current_user.id)
    except booking_service.BookingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except booking_service.BookingValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except booking_service.BookingPermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.get("/games/{game_id}/participants", response_model=list[BookingParticipant])
def get_game_participants_endpoint(game_id: str) -> list[BookingParticipant]:
    bookings = booking_service.get_game_participants(game_id)
    participants: list[BookingParticipant] = []
    for booking in bookings:
        user = user_repository.get_user_by_id(booking.user_id)
        participants.append(
            BookingParticipant(
                booking_id=booking.id,
                user=ParticipantUser(
                    id=booking.user_id,
                    name=user.name if user else None,
                    avatar_url=getattr(user, "avatar_url", None) if user else None,
                ),
                joined_at=booking.joined_at,
            )
        )
    return participants


@router.get("/users/me/games", response_model=list[GameWithBooking])
def get_my_games_endpoint(current_user: UserBase = Depends(_get_current_user)) -> list[GameWithBooking]:
    return booking_service.get_my_games(current_user.id)
