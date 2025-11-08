from __future__ import annotations

from ..schemas.auth import UserBase
from ..schemas.games import Game, GameCreate
from . import game_repository, organizer_service


def create_game(payload: GameCreate, user: UserBase) -> Game:
    payload_with_creator = payload.model_copy(update={"created_by_user_id": user.id})
    game = game_repository.create_game(payload_with_creator)
    if payload.organiser_id:
        organizer_service.link_game_to_organizer(payload.organiser_id, game.id)
    return game


def list_recent_games(limit: int = 50, status_filter: str | None = None) -> list[Game]:
    games = game_repository.list_games(limit=limit)
    if status_filter:
        return [game for game in games if game.status == status_filter]
    return games


def get_game(game_id: str) -> Game | None:
    return game_repository.get_game(game_id)


def update_game_status(game_id: str, status: str) -> Game | None:
    return game_repository.update_game_status(game_id, status)
