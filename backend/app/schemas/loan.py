from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid
from app.models.loan import LoanType, LoanStatus

class LoanApplication(BaseModel):
    loan_amount: float
    loan_type: LoanType
    loan_duration_months: int

    @field_validator("loan_amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Loan amount must be positive")
        if v > 50_000_000:
            raise ValueError("Loan amount cannot exceed 5 crore")
        return v

    @field_validator("loan_duration_months")
    @classmethod
    def duration_valid(cls, v):
        if v < 1 or v > 360:
            raise ValueError("Loan duration must be between 1 and 360 months")
        return v

class LoanStatusUpdate(BaseModel):
    status: LoanStatus
    rejection_reason: Optional[str] = None

class LoanResponse(BaseModel):
    id: uuid.UUID
    loan_amount: float
    loan_type: LoanType
    loan_duration_months: int
    interest_rate: float
    total_repayment: float
    monthly_emi: float
    status: LoanStatus
    rejection_reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class RepaymentScheduleItem(BaseModel):
    month: int
    emi_amount: float
    principal_component: float
    interest_component: float
    remaining_balance: float
