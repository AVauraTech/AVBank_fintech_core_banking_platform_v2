from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.models.loan import Loan, LoanStatus
from app.schemas.loan import LoanApplication, LoanStatusUpdate, LoanResponse, RepaymentScheduleItem
from app.api.deps import CurrentUser, CurrentAdmin, DBSession
from typing import List
import uuid

router = APIRouter(prefix="/loans", tags=["Loans"])

INTEREST_RATES = {
    "Personal": 12.0,
    "Home": 8.5,
    "Car": 9.5,
    "Education": 7.0,
    "Business": 14.0,
}

def calculate_emi(principal: float, annual_rate: float, months: int) -> float:
    if annual_rate == 0 or months == 0:
        return principal / max(months, 1)
    monthly_rate = annual_rate / 12 / 100
    emi = principal * monthly_rate * ((1 + monthly_rate) ** months) / (((1 + monthly_rate) ** months) - 1)
    return round(emi, 2)

@router.post("/apply", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_loan(data: LoanApplication, current_user: CurrentUser, db: DBSession):
    interest_rate = INTEREST_RATES.get(data.loan_type.value, 10.0)
    emi = calculate_emi(data.loan_amount, interest_rate, data.loan_duration_months)
    total_repayment = round(emi * data.loan_duration_months, 2)

    loan = Loan(
        user_id=current_user.id,
        loan_amount=data.loan_amount,
        loan_type=data.loan_type,
        loan_duration_months=data.loan_duration_months,
        interest_rate=interest_rate,
        total_repayment=total_repayment,
        monthly_emi=emi,
        status=LoanStatus.pending,
    )
    db.add(loan)
    await db.flush()
    await db.refresh(loan)
    return loan

@router.get("/me", response_model=List[LoanResponse])
async def get_my_loans(current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Loan).where(Loan.user_id == current_user.id))
    return result.scalars().all()

@router.get("/", response_model=List[LoanResponse])
async def get_all_loans(current_admin: CurrentAdmin, db: DBSession):
    result = await db.execute(select(Loan).order_by(Loan.created_at.desc()))
    return result.scalars().all()

@router.patch("/{loan_id}/status", response_model=LoanResponse)
async def update_loan_status(loan_id: str, data: LoanStatusUpdate, current_admin: CurrentAdmin, db: DBSession):
    try:
        loan_uuid = uuid.UUID(loan_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid loan ID format")

    result = await db.execute(select(Loan).where(Loan.id == loan_uuid))
    loan = result.scalar_one_or_none()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    loan.status = data.status
    if data.status == LoanStatus.rejected and data.rejection_reason:
        loan.rejection_reason = data.rejection_reason
    db.add(loan)
    await db.flush()
    await db.refresh(loan)
    return loan

@router.get("/{loan_id}/repayment-schedule", response_model=List[RepaymentScheduleItem])
async def get_repayment_schedule(loan_id: str, current_user: CurrentUser, db: DBSession):
    try:
        loan_uuid = uuid.UUID(loan_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid loan ID format")

    result = await db.execute(select(Loan).where(Loan.id == loan_uuid))
    loan = result.scalar_one_or_none()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if current_user.role.value == "customer" and loan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    schedule = []
    balance = loan.loan_amount
    monthly_rate = loan.interest_rate / 12 / 100
    for month in range(1, loan.loan_duration_months + 1):
        interest_component = round(balance * monthly_rate, 2)
        principal_component = round(loan.monthly_emi - interest_component, 2)
        balance = round(balance - principal_component, 2)
        schedule.append(RepaymentScheduleItem(
            month=month,
            emi_amount=loan.monthly_emi,
            principal_component=principal_component,
            interest_component=interest_component,
            remaining_balance=max(balance, 0),
        ))
    return schedule
