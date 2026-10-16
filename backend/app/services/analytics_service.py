import json
import os
from datetime import date
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import WasteLog, InventoryItem, SurplusListing, PredictionLog
from backend.app.services.inventory_service import calculate_inventory_status

METRICS_PATH = "reports/model_metrics.json"


def get_dashboard_analytics(db: Session) -> Dict[str, Any]:
    logs = db.query(WasteLog).all()

    total_prep = sum(l.prepared_kg for l in logs) if logs else 0.0
    total_serv = sum(l.served_kg for l in logs) if logs else 0.0
    total_left = sum(l.leftover_kg for l in logs) if logs else 0.0
    waste_rate = round((total_left / total_prep) * 100.0, 1) if total_prep > 0 else 0.0
    total_cost = round(sum(l.leftover_kg * l.cost_per_kg for l in logs), 2) if logs else 0.0

    edible_surplus = round(
        sum(l.leftover_kg for l in logs if l.waste_type == "Edible Surplus"), 2
    )

    # Surplus listing stats
    surplus_items = db.query(SurplusListing).all()
    rescued_kg = round(
        sum(s.quantity_kg for s in surplus_items if s.status == "collected"), 2
    )
    rescue_conversion = (
        round((rescued_kg / edible_surplus) * 100.0, 1) if edible_surplus > 0 else 0.0
    )
    active_surplus_count = sum(
        1 for s in surplus_items if s.status in ["available", "claimed"]
    )

    # Inventory alerts
    inventory_items = db.query(InventoryItem).all()
    today = date.today()
    expired_cnt = 0
    expiring_soon_cnt = 0
    low_stock_cnt = 0

    for item in inventory_items:
        _, status = calculate_inventory_status(
            item.expiry_date, item.current_qty, item.min_threshold_qty, reference_date=today
        )
        if status == "Expired":
            expired_cnt += 1
        elif status == "Expiring Soon":
            expiring_soon_cnt += 1
        elif status == "Low Stock":
            low_stock_cnt += 1

    # Load model metrics if available
    model_status = {
        "is_trained": False,
        "model_name": "No model loaded",
        "rmse_kg": None,
        "mae_kg": None,
        "r2": None,
    }
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                rep = json.load(f)
                best_metrics = rep.get("selected_model_metrics", {})
                model_status = {
                    "is_trained": True,
                    "model_name": rep.get("metadata", {}).get("model_type", "Ridge Regression"),
                    "version": rep.get("metadata", {}).get("model_version", "1.0.0"),
                    "rmse_kg": best_metrics.get("rmse"),
                    "mae_kg": best_metrics.get("mae"),
                    "r2": best_metrics.get("r2"),
                    "validation": rep.get("metadata", {}).get("validation_methodology"),
                    "train_samples": rep.get("metadata", {}).get("train_sample_count"),
                    "test_samples": rep.get("metadata", {}).get("test_sample_count"),
                }
        except Exception:
            pass

    return {
        "total_prepared_kg": round(total_prep, 1),
        "total_served_kg": round(total_serv, 1),
        "total_leftover_kg": round(total_left, 1),
        "waste_rate_percent": waste_rate,
        "total_food_cost_wasted": total_cost,
        "edible_surplus_kg": edible_surplus,
        "rescued_surplus_kg": rescued_kg,
        "rescue_conversion_rate": rescue_conversion,
        "expiring_soon_items_count": expiring_soon_cnt,
        "expired_items_count": expired_cnt,
        "low_stock_items_count": low_stock_cnt,
        "active_surplus_listings_count": active_surplus_count,
        "records_count": len(logs),
        "model_status": model_status,
        "provenance": {
            "waste_measurements": "Actual recorded kitchen scale logs in SQLite",
            "prediction_model": (
                f"Trained {model_status.get('model_name', 'Pipeline')} validated on held-out 2024 test split"
                if model_status["is_trained"]
                else "Deterministic fallback demonstration"
            ),
            "surplus_rescue": "Local demonstration workflow with audited status transitions",
            "inventory_alerts": "Deterministic rules (Expiring Soon <= 3 days, Low Stock <= threshold)",
        },
    }


def get_detailed_insights(db: Session) -> Dict[str, Any]:
    logs = db.query(WasteLog).all()

    # Category breakdown
    cat_stats: Dict[str, Dict[str, float]] = {}
    for l in logs:
        cat = l.waste_category
        if cat not in cat_stats:
            cat_stats[cat] = {"prepared_kg": 0.0, "leftover_kg": 0.0, "cost_wasted": 0.0, "count": 0}
        cat_stats[cat]["prepared_kg"] += l.prepared_kg
        cat_stats[cat]["leftover_kg"] += l.leftover_kg
        cat_stats[cat]["cost_wasted"] += l.leftover_kg * l.cost_per_kg
        cat_stats[cat]["count"] += 1

    category_summary = []
    for cat, data in cat_stats.items():
        rate = round((data["leftover_kg"] / data["prepared_kg"]) * 100, 1) if data["prepared_kg"] > 0 else 0
        category_summary.append({
            "category": cat,
            "prepared_kg": round(data["prepared_kg"], 1),
            "leftover_kg": round(data["leftover_kg"], 1),
            "cost_wasted": round(data["cost_wasted"], 2),
            "waste_rate": rate,
            "meals_count": data["count"],
        })

    # Meal type breakdown
    meal_stats: Dict[str, Dict[str, float]] = {}
    for l in logs:
        m = l.meal_type
        if m not in meal_stats:
            meal_stats[m] = {"prepared_kg": 0.0, "leftover_kg": 0.0, "cost_wasted": 0.0, "count": 0}
        meal_stats[m]["prepared_kg"] += l.prepared_kg
        meal_stats[m]["leftover_kg"] += l.leftover_kg
        meal_stats[m]["cost_wasted"] += l.leftover_kg * l.cost_per_kg
        meal_stats[m]["count"] += 1

    meal_summary = []
    for m, data in meal_stats.items():
        rate = round((data["leftover_kg"] / data["prepared_kg"]) * 100, 1) if data["prepared_kg"] > 0 else 0
        meal_summary.append({
            "meal_type": m,
            "prepared_kg": round(data["prepared_kg"], 1),
            "leftover_kg": round(data["leftover_kg"], 1),
            "cost_wasted": round(data["cost_wasted"], 2),
            "waste_rate": rate,
            "meals_count": data["count"],
        })

    # Daily trend (sorted by date)
    daily_stats: Dict[str, Dict[str, float]] = {}
    for l in logs:
        d = l.date
        if d not in daily_stats:
            daily_stats[d] = {"date": d, "prepared_kg": 0.0, "served_kg": 0.0, "leftover_kg": 0.0, "cost_wasted": 0.0}
        daily_stats[d]["prepared_kg"] += l.prepared_kg
        daily_stats[d]["served_kg"] += l.served_kg
        daily_stats[d]["leftover_kg"] += l.leftover_kg
        daily_stats[d]["cost_wasted"] += l.leftover_kg * l.cost_per_kg

    daily_trend = []
    for d in sorted(daily_stats.keys()):
        item = daily_stats[d]
        rate = (
            round((item["leftover_kg"] / item["prepared_kg"]) * 100, 1)
            if item["prepared_kg"] > 0
            else 0
        )
        daily_trend.append({
            "date": d,
            "prepared_kg": round(item["prepared_kg"], 1),
            "served_kg": round(item["served_kg"], 1),
            "leftover_kg": round(item["leftover_kg"], 1),
            "cost_wasted": round(item["cost_wasted"], 2),
            "waste_rate": rate,
        })

    # Waste reason breakdown
    reason_stats: Dict[str, float] = {}
    for l in logs:
        r = l.waste_reason or "Unspecified"
        reason_stats[r] = reason_stats.get(r, 0.0) + l.leftover_kg

    reason_summary = [
        {"reason": r, "leftover_kg": round(kg, 1)}
        for r, kg in sorted(reason_stats.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "category_summary": category_summary,
        "meal_summary": meal_summary,
        "daily_trend": daily_trend,
        "reason_summary": reason_summary,
    }
