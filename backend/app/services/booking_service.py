from __future__ import annotations

from datetime import datetime, time, timedelta
from math import ceil
from typing import List

from ..schemas.bookings import BookingResponse, GameWithBooking
from ..schemas.games import Game
from . import (
    booking_repository,
    game_repository,
    notification_service,
    email_service,
    user_repository,
    organizer_repository,
)


class BookingNotFoundError(Exception):
    ...


class BookingValidationError(Exception):
    ...


class BookingPermissionError(Exception):
    ...


def _event_datetime(game: Game) -> datetime:
    game_date = game.date
    if isinstance(game_date, datetime):
        event_dt = game_date
    else:
        event_dt = datetime.combine(game_date, datetime.min.time())

    start_time = getattr(game, "start_time", None)
    if isinstance(start_time, time):
        event_dt = event_dt.replace(
            hour=start_time.hour,
            minute=start_time.minute,
            second=start_time.second,
            microsecond=start_time.microsecond,
        )
    return event_dt


def _hours_until_game(game: Game) -> float:
    event_dt = _event_datetime(game)
    now = datetime.now(tz=event_dt.tzinfo) if event_dt.tzinfo else datetime.utcnow()
    delta = event_dt - now
    return delta.total_seconds() / 3600


def _ensure_game_future(game: Game) -> None:
    event_dt = _event_datetime(game)
    now = datetime.now(tz=event_dt.tzinfo) if event_dt.tzinfo else datetime.utcnow()

    if event_dt < now:
        raise BookingValidationError("Cannot join a game that has already occurred.")


def _parse_cancellation_hours(cancellation: str | None) -> float:
    if not cancellation:
        return 24.0
    digits = "".join(ch for ch in cancellation if (ch.isdigit() or ch == "."))
    try:
        value = float(digits)
        return value if value > 0 else 24.0
    except ValueError:
        return 24.0


def _get_game_owner_user(game: Game):
    if getattr(game, "created_by_user_id", None):
        user_record = user_repository.get_user_by_id(game.created_by_user_id)
        if user_record:
            return user_record
    if getattr(game, "organiser_id", None):
        organizer_record = organizer_repository.get_by_id(game.organiser_id)
        if organizer_record:
            return user_repository.get_user_by_id(organizer_record.user_id)
    return None


def join_game(game_id: str, user_id: str, notes: str | None = None) -> BookingResponse:
    game = game_repository.get_game(game_id)
    if not game:
        raise BookingNotFoundError("Game not found.")

    _ensure_game_future(game)

    cancellation_hours = _parse_cancellation_hours(getattr(game, "cancellation", None))
    cancel_deadline = _event_datetime(game) - timedelta(hours=cancellation_hours)
    join_cutoff = cancel_deadline - timedelta(minutes=30)
    now = datetime.utcnow()
    if now >= join_cutoff:
        raise BookingValidationError("This game is no longer accepting joins.")

    if booking_repository.get_booking(game_id, user_id):
        raise BookingValidationError("You have already joined this game.")

    current_count = booking_repository.count_active_bookings(game_id)
    if current_count >= (game.players or 0):
        raise BookingValidationError("This game is full.")

    booking = booking_repository.create_booking(
        game_id,
        user_id,
        notes=notes,
    )

    new_count = current_count + 1
    updated_ids = list(dict.fromkeys([*game.participant_user_ids, user_id]))
    game_repository.update_participant_user_ids(game.id, updated_ids)
    game.participant_user_ids = updated_ids

    participant = user_repository.get_user_by_id(user_id)
    if participant:
        email_service.send_booking_confirmation_email(
            game=game,
            participant_name=participant.name,
            participant_email=participant.email,
        )
        email_service.schedule_game_reminder_email(
            game=game,
            recipient=participant.email,
            name=participant.name,
        )

    owner = _get_game_owner_user(game)
    if owner:
        total_players = max(game.players or 0, 0)
        half_target = max(1, ceil(total_players / 2)) if total_players else 1
        if new_count == half_target and total_players > 1:
            email_service.send_game_half_full_email(
                game=game,
                organiser_name=owner.name,
                organiser_email=owner.email,
                current_count=new_count,
            )
        if new_count == total_players and total_players > 0:
            email_service.send_game_full_email(
                game=game,
                organiser_name=owner.name,
                organiser_email=owner.email,
            )

    notification_service.send_booking_confirmation(user_id, game)
    if game.organiser_id:
        notification_service.notify_organizer_new_participant(game.organiser_id, booking)

    return BookingResponse(**booking.dict())


def cancel_booking(booking_id: str, user_id: str) -> BookingResponse:
    booking = booking_repository.get_booking_by_id(booking_id)
    if not booking:
        raise BookingNotFoundError("Booking not found.")

    if booking.user_id != user_id:
        raise BookingPermissionError("You can only cancel your own bookings.")

    game = game_repository.get_game(booking.game_id)
    if not game:
        raise BookingNotFoundError("Game not found.")

    _ensure_game_future(game)

    hours_until_game = _hours_until_game(game)
    cancellation_hours = _parse_cancellation_hours(getattr(game, "cancellation", None))
    if hours_until_game < cancellation_hours:
        raise BookingValidationError("Cancellation period has passed")

    deleted_booking = booking_repository.delete_booking(booking_id)
    if not deleted_booking:
        raise BookingValidationError("Unable to cancel booking at this time.")

    if booking.user_id in game.participant_user_ids:
        updated_ids = [pid for pid in game.participant_user_ids if pid != booking.user_id]
        game_repository.update_participant_user_ids(game.id, updated_ids)
        game.participant_user_ids = updated_ids

    if game.organiser_id:
        notification_service.notify_organizer_cancellation(game.organiser_id, booking)

    return BookingResponse(**deleted_booking.dict())


def get_game_participants(game_id: str) -> List[BookingResponse]:
    bookings = booking_repository.get_game_participants(game_id)
    return [BookingResponse(**booking.dict()) for booking in bookings]


def get_user_bookings(user_id: str) -> List[BookingResponse]:
    bookings = booking_repository.get_user_bookings(user_id)
    return [BookingResponse(**booking.dict()) for booking in bookings]


def get_my_games(user_id: str) -> List[GameWithBooking]:
    bookings = booking_repository.get_user_bookings(user_id)
    results: List[GameWithBooking] = []
    for booking in bookings:
        game = game_repository.get_game(booking.game_id)
        if not game:
            continue
        participants = booking_repository.count_active_bookings(booking.game_id)
        results.append(
            GameWithBooking(
                game=game,
                booking=BookingResponse(**booking.dict()),
                participants_count=participants,
            )
        )
    return results
