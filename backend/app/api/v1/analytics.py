from fastapi import APIRouter
from app.services.analytics import get_monthly_transactions, get_account_distribution, get_user_growth, get_dashboard_summary
from app.api.deps import CurrentAdmin, DBSession
from typing import Any, Dict, List

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def dashboard_summary(current_admin: CurrentAdmin, db: DBSession) -> Dict[str, Any]:
    return await get_dashboard_summary(db)

@router.get("/transactions/monthly")
async def monthly_transactions(current_admin: CurrentAdmin, db: DBSession) -> List[Dict[str, Any]]:
    return await get_monthly_transactions(db)

@router.get("/accounts/distribution")
async def account_distribution(current_admin: CurrentAdmin, db: DBSession) -> List[Dict[str, Any]]:
    return await get_account_distribution(db)

@router.get("/users/growth")
async def user_growth(current_admin: CurrentAdmin, db: DBSession) -> List[Dict[str, Any]]:
    return await get_user_growth(db)
