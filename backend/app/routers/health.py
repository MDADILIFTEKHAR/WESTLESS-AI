from fastapi import APIRouter
from datetime import datetime, timezone
import os

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "WasteLess AI Backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_loaded": os.path.exists("models/food_waste_pipeline.joblib"),
    }
