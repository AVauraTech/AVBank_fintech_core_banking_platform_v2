from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from datetime import date
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.api.deps import CurrentUser, CurrentAdmin, DBSession
from typing import List

router = APIRouter(prefix="/accounts", tags=["Accounts"])

def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(data: AccountCreate, current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Account).where(Account.account_number == data.account_number))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Account number already exists")

    if current_user.role.value == "customer":
        result = await db.execute(select(Account).where(Account.user_id == current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="You already have an active account")

    age = calculate_age(data.dob)
    joint_name = None
    joint_dob = None
    if age < 18:
        if not data.joint_account_holder_name or not data.joint_account_holder_dob:
            raise HTTPException(status_code=400, detail="Joint account holder required for applicants under 18 years")
        joint_age = calculate_age(data.joint_account_holder_dob)
        if joint_age < 18:
            raise HTTPException(status_code=400, detail="Joint account holder must be 18+ years")
        joint_name = data.joint_account_holder_name
        joint_dob = data.joint_account_holder_dob

    account = Account(
        account_number=data.account_number,
        user_id=current_user.id,
        name=data.name,
        dob=data.dob,
        gender=data.gender,
        city=data.city,
        mobile_number=data.mobile_number,
        branch=data.branch,
        account_type=data.account_type,
        total_balance=data.initial_deposit,
        joint_account_holder_name=joint_name,
        joint_account_holder_dob=joint_dob,
    )
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account

@router.get("/me", response_model=List[AccountResponse])
async def get_my_accounts(current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Account).where(Account.user_id == current_user.id))
    return result.scalars().all()

@router.get("/", response_model=List[AccountResponse])
async def get_all_accounts(current_admin: CurrentAdmin, db: DBSession):
    result = await db.execute(select(Account))
    return result.scalars().all()

@router.get("/{account_number}", response_model=AccountResponse)
async def get_account(account_number: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Account).where(Account.account_number == account_number))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if current_user.role.value == "customer" and account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return account

@router.patch("/{account_number}", response_model=AccountResponse)
async def update_account(account_number: str, data: AccountUpdate, current_user: CurrentUser, db: DBSession):
    result = await db.execute(select(Account).where(Account.account_number == account_number))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if current_user.role.value == "customer" and account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(account, field, value)
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account

@router.delete("/{account_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(account_number: str, current_admin: CurrentAdmin, db: DBSession):
    result = await db.execute(select(Account).where(Account.account_number == account_number))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_active = False
    db.add(account)
