from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.models.account import Account
from app.models.transaction import Transaction, TransactionType, PaymentMethod
from app.schemas.transaction import DepositRequest, WithdrawalRequest, TransactionResponse
from app.services.fraud_detection import check_fraud
from app.api.deps import CurrentUser, DBSession, RedisClient
from typing import List

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/deposit", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def deposit(data: DepositRequest, current_user: CurrentUser, db: DBSession, redis: RedisClient):
    result = await db.execute(select(Account).where(Account.account_number == data.account_number))
    account = result.scalar_one_or_none()
    if not account or not account.is_active:
        raise HTTPException(status_code=404, detail="Account not found or inactive")
    if current_user.role.value == "customer" and account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    is_flagged, fraud_reason = await check_fraud(str(account.id), data.amount, "deposit", redis)

    account.total_balance += data.amount
    transaction = Transaction(
        account_id=account.id,
        transaction_type=TransactionType.deposit,
        amount=data.amount,
        balance_after=account.total_balance,
        payment_method=data.payment_method,
        description=data.description,
        is_flagged=is_flagged,
        fraud_reason=fraud_reason if is_flagged else None,
    )
    db.add(account)
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)
    return transaction

@router.post("/withdraw", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def withdraw(data: WithdrawalRequest, current_user: CurrentUser, db: DBSession, redis: RedisClient):
    result = await db.execute(select(Account).where(Account.account_number == data.account_number))
    account = result.scalar_one_or_none()
    if not account or not account.is_active:
        raise HTTPException(status_code=404, detail="Account not found or inactive")
    if current_user.role.value == "customer" and account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if account.total_balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    is_flagged, fraud_reason = await check_fraud(str(account.id), data.amount, "withdrawal", redis)

    account.total_balance -= data.amount
    transaction = Transaction(
        account_id=account.id,
        transaction_type=TransactionType.withdrawal,
        amount=data.amount,
        balance_after=account.total_balance,
        payment_method=data.payment_method,
        description=data.description,
        is_flagged=is_flagged,
        fraud_reason=fraud_reason if is_flagged else None,
    )
    db.add(account)
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)
    return transaction

@router.get("/account/{account_number}", response_model=List[TransactionResponse])
async def get_transaction_history(account_number: str, current_user: CurrentUser, db: DBSession, limit: int = 50, offset: int = 0):
    result = await db.execute(select(Account).where(Account.account_number == account_number))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if current_user.role.value == "customer" and account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(
        select(Transaction)
        .where(Transaction.account_id == account.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()

@router.get("/flagged", response_model=List[TransactionResponse])
async def get_flagged_transactions(current_user: CurrentUser, db: DBSession):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(
        select(Transaction).where(Transaction.is_flagged == True).order_by(Transaction.created_at.desc())
    )
    return result.scalars().all()
