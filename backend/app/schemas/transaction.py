from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid
from app.models.transaction import TransactionType, PaymentMethod

class DepositRequest(BaseModel):
    account_number: str
    amount: float
    payment_method: PaymentMethod = PaymentMethod.cash
    description: Optional[str] = None
    card_number: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

class WithdrawalRequest(BaseModel):
    account_number: str
    amount: float
    payment_method: PaymentMethod = PaymentMethod.cash
    description: Optional[str] = None
    card_number: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

class TransactionResponse(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    transaction_type: TransactionType
    amount: float
    balance_after: float
    payment_method: PaymentMethod
    description: Optional[str]
    is_flagged: bool
    fraud_reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
