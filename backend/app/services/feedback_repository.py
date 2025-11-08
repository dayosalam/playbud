from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, EmailStr

from supabase import Client

from .supabase_client import get_supabase_client
from ..schemas.feedback import Feedback, FeedbackCreate

FEEDBACK_TABLE = "feedback"


def _client() -> Client:
    client = get_supabase_client()
    if client is None:
        raise RuntimeError(
            "Supabase client is not configured. Ensure SUPABASE_URL and SERVICE_ROLE environment variables are set."
        )
    return client


class FeedbackRecord(BaseModel):
    id: str
    name: str
    email: EmailStr
    rating: int
    message: str
    created_at: str


def _record_to_feedback(record: FeedbackRecord) -> Feedback:
    created_at = datetime.fromisoformat(record.created_at.replace("Z", "+00:00"))
    return Feedback(
        id=record.id,
        name=record.name,
        email=record.email,
        rating=record.rating,
        message=record.message,
        created_at=created_at,
    )


def create_feedback(payload: FeedbackCreate) -> Feedback:
    now = datetime.utcnow().isoformat()
    record = FeedbackRecord(
        id=str(uuid4()),
        name=payload.name.strip(),
        email=payload.email,
        rating=payload.rating,
        message=payload.message.strip(),
        created_at=now,
    )
    client = _client()
    client.table(FEEDBACK_TABLE).insert(record.dict()).execute()
    return _record_to_feedback(record)
