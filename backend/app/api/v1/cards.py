from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from datetime import date
from app.models.card import Card, CardTransaction, CardStatus
from app.schemas.card import CardRequest, CardStatusUpdate, CardResponse, CardTransactionResponse
from app.api.deps import CurrentUser, DBSession
from typing import List
import random

router = APIRouter(prefix="/cards", tags=["Cards"])

def generate_card_number() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(16)])

@router.post("/request", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def request_card(data: CardRequest, current_user: CurrentUser, db: DBSession):
    card_number = generate_card_number()
    today = date.today()
    expiry_date = today.replace(year=today.year + 3)
    card = Card(
        card_number=card_number,
        user_id=current_user.id,
        card_type=data.card_type,
        status=CardStatus.inactive,
        expiry_date=expiry_date,
    )
    db.add(card)
    await db.flush()
    await db.refresh(card)
    return card

@router.get("/me", response_model=List[CardResponse])
async def get_my_cards(current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Card).where(Card.user_id == current_user.id))
    return result.scalars().all()

@router.patch("/{card_number}/status", response_model=CardResponse)
async def update_card_status(card_number: str, data: CardStatusUpdate, current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Card).where(Card.card_number == card_number))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if current_user.role.value == "customer" and card.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    card.status = data.status
    db.add(card)
    await db.flush()
    await db.refresh(card)
    return card

@router.get("/{card_number}/transactions", response_model=List[CardTransactionResponse])
async def get_card_transactions(card_number: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Card).where(Card.card_number == card_number))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if current_user.role.value == "customer" and card.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(
        select(CardTransaction).where(CardTransaction.card_id == card.id).order_by(CardTransaction.created_at.desc())
    )
    return result.scalars().all()
