import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Enum, ForeignKey, Date, func, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum

class CardType(str, enum.Enum):
    debit = "Debit"
    credit = "Credit"

class CardStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    blocked = "blocked"

class CardTransactionType(str, enum.Enum):
    debit = "debit"
    credit = "credit"

class Card(Base):
    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_number: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    card_type: Mapped[CardType] = mapped_column(Enum(CardType), nullable=False)
    status: Mapped[CardStatus] = mapped_column(Enum(CardStatus), default=CardStatus.inactive)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="cards")
    card_transactions = relationship("CardTransaction", back_populates="card", cascade="all, delete-orphan")

class CardTransaction(Base):
    __tablename__ = "card_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False)
    transaction_type: Mapped[CardTransactionType] = mapped_column(Enum(CardTransactionType), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    merchant: Mapped[str] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    card = relationship("Card", back_populates="card_transactions")
