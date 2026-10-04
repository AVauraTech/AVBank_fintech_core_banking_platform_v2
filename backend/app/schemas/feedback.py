from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid

class FeedbackCreate(BaseModel):
    subject: str
    feedback_text: str
    rating: int = 5

    @field_validator("rating")
    @classmethod
    def rating_valid(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

class FeedbackResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject: str
    feedback_text: str
    rating: int
    created_at: datetime

    model_config = {"from_attributes": True}
