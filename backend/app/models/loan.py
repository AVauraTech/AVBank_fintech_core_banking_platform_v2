import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, ForeignKey, Integer, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum

class LoanType(str, enum.Enum):
    personal = "Personal"
    home = "Home"
    car = "Car"
    education = "Education"
    business = "Business"

class LoanStatus(str, enum.Enum):
    pending = "Pending"
    approved = "Approved"
    rejected = "Rejected"
    closed = "Closed"

class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    loan_amount: Mapped[float] = mapped_column(Float, nullable=False)
    loan_type: Mapped[LoanType] = mapped_column(Enum(LoanType), nullable=False)
    loan_duration_months: Mapped[int] = mapped_column(Integer, nullable=False)
    interest_rate: Mapped[float] = mapped_column(Float, default=5.0)
    total_repayment: Mapped[float] = mapped_column(Float, nullable=False)
    monthly_emi: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[LoanStatus] = mapped_column(Enum(LoanStatus), default=LoanStatus.pending)
    rejection_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="loans")
