from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any

async def get_monthly_transactions(db: AsyncSession) -> List[Dict[str, Any]]:
    result = await db.execute(text("""
        SELECT
            TO_CHAR(created_at, 'YYYY-MM') AS month,
            transaction_type,
            COALESCE(SUM(amount), 0) AS total_amount,
            COUNT(*) AS count
        FROM transactions
        GROUP BY TO_CHAR(created_at, 'YYYY-MM'), transaction_type
        ORDER BY month
    """))
    rows = result.fetchall()
    return [
        {
            "month": row.month,
            "transaction_type": str(row.transaction_type),
            "total_amount": float(row.total_amount),
            "count": int(row.count),
        }
        for row in rows
    ]

async def get_account_distribution(db: AsyncSession) -> List[Dict[str, Any]]:
    result = await db.execute(text("""
        SELECT account_type, COUNT(*) AS count, COALESCE(SUM(total_balance), 0) AS total_balance
        FROM accounts
        WHERE is_active = true
        GROUP BY account_type
    """))
    rows = result.fetchall()
    return [
        {
            "account_type": str(row.account_type),
            "count": int(row.count),
            "total_balance": float(row.total_balance),
        }
        for row in rows
    ]

async def get_user_growth(db: AsyncSession) -> List[Dict[str, Any]]:
    result = await db.execute(text("""
        SELECT
            TO_CHAR(created_at, 'YYYY-MM') AS month,
            COUNT(*) AS new_users,
            SUM(COUNT(*)) OVER (ORDER BY TO_CHAR(created_at, 'YYYY-MM')) AS cumulative_users
        FROM users
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
    """))
    rows = result.fetchall()
    return [
        {
            "month": row.month,
            "new_users": int(row.new_users),
            "cumulative_users": int(row.cumulative_users),
        }
        for row in rows
    ]

async def get_dashboard_summary(db: AsyncSession) -> Dict[str, Any]:
    total_users_res = await db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true"))
    total_accounts_res = await db.execute(text("SELECT COUNT(*) FROM accounts WHERE is_active = true"))
    total_balance_res = await db.execute(text("SELECT COALESCE(SUM(total_balance), 0) FROM accounts WHERE is_active = true"))
    total_loans_res = await db.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Approved'"))
    pending_loans_res = await db.execute(text("SELECT COUNT(*) FROM loans WHERE status = 'Pending'"))
    flagged_tx_res = await db.execute(text("SELECT COUNT(*) FROM transactions WHERE is_flagged = true"))

    return {
        "total_users": total_users_res.scalar() or 0,
        "total_accounts": total_accounts_res.scalar() or 0,
        "total_balance": float(total_balance_res.scalar() or 0),
        "approved_loans": total_loans_res.scalar() or 0,
        "pending_loans": pending_loans_res.scalar() or 0,
        "flagged_transactions": flagged_tx_res.scalar() or 0,
    }
