from __future__ import annotations

from ..schemas.auth import UserBase
from ..schemas.games import Game, GameCreate
from . import (
    game_repository,
    organizer_service,
    email_service,
    organizer_repository,
    user_repository,
)


def create_game(payload: GameCreate, user: UserBase) -> Game:
    payload_with_creator = payload.model_copy(update={"created_by_user_id": user.id})
    game = game_repository.create_game(payload_with_creator)
    if payload.organiser_id:
        organizer_service.link_game_to_organizer(payload.organiser_id, game.id)
    email_service.send_game_pending_review_email(game=game, organiser_name=user.name, organiser_email=user.email)
    return game


def list_recent_games(limit: int = 50, status_filter: str | None = None) -> list[Game]:
    games = game_repository.list_games(limit=limit)
    if status_filter:
        return [game for game in games if game.status == status_filter]
    return games


def get_game(game_id: str) -> Game | None:
    return game_repository.get_game(game_id)


def _get_game_owner_user(game: Game):
    user_record = None
    if game.created_by_user_id:
        user_record = user_repository.get_user_by_id(game.created_by_user_id)
        if user_record:
            return user_record
    if game.organiser_id:
        organizer_record = organizer_repository.get_by_id(game.organiser_id)
        if organizer_record:
            user_record = user_repository.get_user_by_id(organizer_record.user_id)
    return user_record


def list_user_created_games(user: UserBase, limit: int = 500) -> list[Game]:
    organiser_id = getattr(user, "organiser_id", None)
    games = game_repository.list_games(limit=limit)
    return [
        game
        for game in games
        if game.created_by_user_id == user.id or (organiser_id and game.organiser_id == organiser_id)
    ]


def update_game_status(game_id: str, status: str) -> Game | None:
    updated = game_repository.update_game_status(game_id, status)
    if not updated:
        return None

    owner = _get_game_owner_user(updated)
    if owner:
        if status == "confirmed":
            email_service.send_game_approved_email(
                game=updated,
                organiser_name=owner.name,
                organiser_email=owner.email,
            )
            email_service.schedule_game_reminder_email(game=updated, recipient=owner.email, name=owner.name)
        elif status == "unapproved":
            email_service.send_game_rejected_email(
                game=updated,
                organiser_name=owner.name,
                organiser_email=owner.email,
            )
    return updated
