from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas.games import Game, GameCreate
from ..services import game_service
from ..schemas.auth import UserBase
from .auth import _get_current_user

router = APIRouter()


@router.post("/", response_model=Game, status_code=status.HTTP_201_CREATED)
def create_game(payload: GameCreate, current_user: UserBase = Depends(_get_current_user)) -> Game:
    return game_service.create_game(payload, current_user)


@router.get("/", response_model=list[Game])
def list_games(limit: int = 50) -> list[Game]:
    return game_service.list_recent_games(limit=limit)


@router.get("/{game_id}", response_model=Game)
def get_game(game_id: str) -> Game:
    game = game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    return game


@router.get("/me/created", response_model=list[Game])
def list_my_created_games(current_user: UserBase = Depends(_get_current_user)) -> list[Game]:
    return game_service.list_user_created_games(current_user)
