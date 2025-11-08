from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class FeedbackCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    rating: int = Field(..., ge=1, le=5)
    message: str = Field(..., min_length=5, max_length=2000)


class Feedback(BaseModel):
    id: str
    name: str
    email: EmailStr
    rating: int
    message: str
    created_at: datetime
