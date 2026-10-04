from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid
from app.models.card import CardType, CardStatus, CardTransactionType

class CardRequest(BaseModel):
    card_type: CardType

class CardStatusUpdate(BaseModel):
    status: CardStatus

class CardTransactionCreate(BaseModel):
    card_number: str
    transaction_type: CardTransactionType
    amount: float
    merchant: Optional[str] = None
    description: Optional[str] = None

class CardTransactionResponse(BaseModel):
    id: uuid.UUID
    card_id: uuid.UUID
    transaction_type: CardTransactionType
    amount: float
    merchant: Optional[str]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class CardResponse(BaseModel):
    id: uuid.UUID
    card_number: str
    card_type: CardType
    status: CardStatus
    expiry_date: date
    created_at: datetime

    model_config = {"from_attributes": True}
