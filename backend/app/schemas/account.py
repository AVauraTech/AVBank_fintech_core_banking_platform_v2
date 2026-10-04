from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
import uuid
from app.models.account import AccountType, Gender

class AccountCreate(BaseModel):
    account_number: str
    name: str
    dob: date
    gender: Gender
    city: str
    mobile_number: str
    branch: str
    account_type: AccountType
    initial_deposit: float = 0.0
    joint_account_holder_name: Optional[str] = None
    joint_account_holder_dob: Optional[date] = None

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v):
        if not v.isdigit() or len(v) not in [10, 12]:
            raise ValueError("Invalid mobile number")
        return v

    @field_validator("initial_deposit")
    @classmethod
    def validate_deposit(cls, v):
        if v < 0:
            raise ValueError("Initial deposit cannot be negative")
        return v

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    mobile_number: Optional[str] = None
    branch: Optional[str] = None

class AccountResponse(BaseModel):
    id: uuid.UUID
    account_number: str
    name: str
    dob: date
    gender: Gender
    city: str
    mobile_number: str
    branch: str
    account_type: AccountType
    total_balance: float
    is_active: bool
    joint_account_holder_name: Optional[str]
    joint_account_holder_dob: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}
