from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas.organizers import Organizer, OrganizerCreate
from ..services import organizer_service, email_service
from ..schemas.auth import UserBase
from .auth import _get_current_user

router = APIRouter()


@router.post("/", response_model=Organizer, status_code=status.HTTP_200_OK)
def create_organizer(payload: OrganizerCreate, current_user: UserBase = Depends(_get_current_user)) -> Organizer:
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create organizer for another user")
    existing = organizer_service.get_by_user_id(current_user.id)
    organizer = organizer_service.get_or_create(payload)
    if (existing is None or not existing.sports) and organizer.sports:
        email_service.send_organizer_review_email(recipient=current_user.email, name=current_user.name)
    return organizer


@router.get("/me", response_model=Organizer)
def get_my_organizer(current_user: UserBase = Depends(_get_current_user)) -> Organizer:
    organizer = organizer_service.get_by_user_id(current_user.id)
    if not organizer:
        organizer = organizer_service.get_or_create(OrganizerCreate(user_id=current_user.id))
    return organizer
