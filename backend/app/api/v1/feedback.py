from fastapi import APIRouter
from sqlalchemy import select
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.api.deps import CurrentUser, CurrentAdmin, DBSession
from typing import List

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("/", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(data: FeedbackCreate, current_user: CurrentUser, db: DBSession):
    feedback = Feedback(
        user_id=current_user.id,
        subject=data.subject,
        feedback_text=data.feedback_text,
        rating=data.rating,
    )
    db.add(feedback)
    await db.flush()
    await db.refresh(feedback)
    return feedback

@router.get("/me", response_model=List[FeedbackResponse])
async def get_my_feedback(current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Feedback).where(Feedback.user_id == current_user.id))
    return result.scalars().all()

@router.get("/", response_model=List[FeedbackResponse])
async def get_all_feedback(current_admin: CurrentAdmin, db: DBSession):
    result = await db.execute(select(Feedback).order_by(Feedback.created_at.desc()))
    return result.scalars().all()
