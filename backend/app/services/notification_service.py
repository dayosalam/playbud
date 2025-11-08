from __future__ import annotations

from ..schemas.bookings import Booking
from ..schemas.games import Game


def send_booking_confirmation(user_id: str, game: Game) -> None:
    # Placeholder for real notification logic (email, push, etc.)
    _log("booking_confirmation", user_id=user_id, game_id=game.id)


def notify_organizer_new_participant(organiser_id: str, booking: Booking) -> None:
    _log("organizer_new_participant", organiser_id=organiser_id, booking_id=booking.id)


def notify_organizer_cancellation(organiser_id: str, booking: Booking) -> None:
    _log("organizer_cancellation", organiser_id=organiser_id, booking_id=booking.id)


def notify_waitlist_promotion(user_id: str, game: Game) -> None:
    _log("waitlist_promotion", user_id=user_id, game_id=game.id)


def _log(event: str, **payload: object) -> None:
    # Intentional no-op; replace with structured logging or message queue integration.
    return None
