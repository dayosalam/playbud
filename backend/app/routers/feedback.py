from fastapi import APIRouter, HTTPException, status

from ..schemas.feedback import Feedback, FeedbackCreate
from ..services import feedback_repository

router = APIRouter()


@router.post("/feedback", response_model=Feedback, status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: FeedbackCreate) -> Feedback:
    try:
        return feedback_repository.create_feedback(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
