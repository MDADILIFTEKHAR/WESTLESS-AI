from datetime import datetime, date
from typing import Tuple


def calculate_inventory_status(
    expiry_date_str: str,
    current_qty: float,
    min_threshold_qty: float,
    reference_date: date = None,
) -> Tuple[int, str]:
    """
    Deterministic rule-based alert evaluation.
    Returns (days_to_expiry, alert_status).
    """
    if reference_date is None:
        reference_date = date.today()

    try:
        expiry_dt = datetime.strptime(expiry_date_str.strip(), "%Y-%m-%d").date()
        days_to_expiry = (expiry_dt - reference_date).days
    except Exception:
        # Default fallback if parsing fails
        days_to_expiry = 999

    if days_to_expiry < 0:
        alert_status = "Expired"
    elif days_to_expiry <= 3:
        alert_status = "Expiring Soon"
    elif current_qty <= min_threshold_qty:
        alert_status = "Low Stock"
    else:
        alert_status = "Safe"

    return days_to_expiry, alert_status
