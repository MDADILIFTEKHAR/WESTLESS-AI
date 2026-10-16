import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.analytics_service import (
    get_dashboard_analytics,
    get_detailed_insights,
)
from backend.app.services.seed_data import seed_demo_database

router = APIRouter(tags=["Dashboard & Analytics"])

METRICS_PATH = "reports/model_metrics.json"


@router.get("/dashboard/summary")
def get_summary(db: Session = Depends(get_db)):
    return get_dashboard_analytics(db)


@router.get("/dashboard/insights")
def get_insights(db: Session = Depends(get_db)):
    return get_detailed_insights(db)


@router.get("/model/metrics")
def get_metrics_report():
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=404,
            detail="Model metrics report not found. Please run ml/train_model.py first.",
        )
    with open(METRICS_PATH, "r") as f:
        return json.load(f)


@router.post("/demo/seed")
def seed_data(db: Session = Depends(get_db)):
    res = seed_demo_database(db, force=False)
    return res


@router.post("/demo/reset")
def reset_and_seed(db: Session = Depends(get_db)):
    res = seed_demo_database(db, force=True)
    return res
