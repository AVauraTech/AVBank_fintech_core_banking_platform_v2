import uuid
from datetime import date, datetime
from sqlalchemy import String, Float, Date, DateTime, Enum, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum

class AccountType(str, enum.Enum):
    savings = "Savings"
    current = "Current"

class Gender(str, enum.Enum):
    M = "M"
    F = "F"
    O = "O"

class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    mobile_number: Mapped[str] = mapped_column(String(15), nullable=False)
    branch: Mapped[str] = mapped_column(String(50), nullable=False)
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType), nullable=False)
    total_balance: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    joint_account_holder_name: Mapped[str] = mapped_column(String(100), nullable=True)
    joint_account_holder_dob: Mapped[date] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
