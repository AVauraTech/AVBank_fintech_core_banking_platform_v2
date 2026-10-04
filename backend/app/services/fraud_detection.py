from typing import Tuple
from app.core.config import settings
import redis.asyncio as redis

async def check_fraud(
    account_id: str,
    amount: float,
    transaction_type: str,
    redis_client: redis.Redis,
) -> Tuple[bool, str]:
    """
    Rule-based & behavioral fraud detection.
    Evaluates velocity, threshold anomalies, and transaction patterns.
    Returns (is_flagged: bool, reason: str)
    """
    # Rule 1: Large transaction threshold anomaly
    if amount >= settings.FRAUD_LARGE_TRANSACTION_THRESHOLD:
        return True, f"High-value transaction: amount {amount:,.2f} exceeds compliance threshold {settings.FRAUD_LARGE_TRANSACTION_THRESHOLD:,.2f}"

    # Rule 2: Transaction velocity check (high frequency in short window)
    if redis_client:
        try:
            velocity_key = f"fraud:velocity:{account_id}"
            count = await redis_client.incr(velocity_key)
            if count == 1:
                await redis_client.expire(velocity_key, settings.FRAUD_VELOCITY_WINDOW_SECONDS)

            if count > settings.FRAUD_VELOCITY_MAX_TRANSACTIONS:
                return True, f"Velocity anomaly: {count} transactions within {settings.FRAUD_VELOCITY_WINDOW_SECONDS}s window"
        except Exception:
            pass

    # Rule 3: High-value withdrawal of suspiciously round amounts
    if transaction_type == "withdrawal" and amount >= 50000 and amount % 10000 == 0:
        return True, f"Pattern alert: Large round-sum cash withdrawal ({amount:,.2f})"

    return False, ""
