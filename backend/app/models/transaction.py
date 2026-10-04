import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, ForeignKey, Boolean, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum

class TransactionType(str, enum.Enum):
    deposit = "deposit"
    withdrawal = "withdrawal"

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    online = "online"

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    balance_after: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), default=PaymentMethod.cash)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    fraud_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    account = relationship("Account", back_populates="transactions")
