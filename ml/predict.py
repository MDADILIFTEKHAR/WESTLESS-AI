import os
import sys
import json
import logging
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.train_model import NUMERIC_FEATURES, CATEGORICAL_FEATURES

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ml_predictor")

MODEL_PATH = "models/food_waste_pipeline.joblib"
METRICS_PATH = "reports/model_metrics.json"

_CACHED_PIPELINE = None
_CACHED_METRICS = None


def load_model_and_metrics():
    global _CACHED_PIPELINE, _CACHED_METRICS
    if _CACHED_PIPELINE is None and os.path.exists(MODEL_PATH):
        try:
            _CACHED_PIPELINE = joblib.load(MODEL_PATH)
            logger.info("Successfully loaded ML model from %s", MODEL_PATH)
        except Exception as e:
            logger.error("Failed loading model pipeline: %s", e)
            _CACHED_PIPELINE = None

    if _CACHED_METRICS is None and os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                _CACHED_METRICS = json.load(f)
        except Exception as e:
            logger.error("Failed loading metrics report: %s", e)
            _CACHED_METRICS = None

    return _CACHED_PIPELINE, _CACHED_METRICS


def predict_food_waste(
    meals_planned: int,
    kitchen_staff: int,
    temperature_C: float,
    humidity_percent: float,
    day_of_week: int,
    special_event: int,
    past_waste_kg: float,
    staff_experience: str,
    waste_category: str,
) -> Dict[str, Any]:
    """
    Predict food waste in kilograms using the trained ML pipeline or an explicitly labeled fallback.
    """
    pipeline, metrics = load_model_and_metrics()

    # Normalize category names
    norm_category = str(waste_category).strip().capitalize()
    if norm_category not in ["Meat", "Dairy", "Vegetables", "Grains"]:
        norm_category = "Vegetables"  # Safe default category

    norm_experience = str(staff_experience).strip().capitalize()
    if norm_experience not in ["Beginner", "Intermediate", "Expert", "Unknown"]:
        norm_experience = "Intermediate"

    if pipeline is not None:
        # Pre-meal feature mapping: meals_planned maps to the dataset's meals scale
        input_data = pd.DataFrame(
            [
                {
                    "meals_served": float(meals_planned),
                    "kitchen_staff": float(kitchen_staff),
                    "temperature_C": float(temperature_C),
                    "humidity_percent": float(humidity_percent),
                    "day_of_week": int(day_of_week),
                    "special_event": int(special_event),
                    "past_waste_kg": float(past_waste_kg),
                    "staff_experience": norm_experience,
                    "waste_category": norm_category,
                }
            ]
        )

        try:
            raw_pred = pipeline.predict(input_data)[0]
            pred_kg = max(0.0, float(raw_pred))

            rmse = (
                metrics.get("selected_model_metrics", {}).get("rmse", 7.22)
                if metrics
                else 7.22
            )
            model_ver = (
                metrics.get("metadata", {}).get("model_version", "1.0.0")
                if metrics
                else "1.0.0"
            )
            model_type = (
                metrics.get("metadata", {}).get("model_type", "Ridge Regression Pipeline")
                if metrics
                else "Ridge Regression Pipeline"
            )

            # 90% confidence uncertainty interval (approx. 1.645 * RMSE)
            margin = round(1.645 * rmse, 2)
            lower_bound = max(0.0, round(pred_kg - margin, 2))
            upper_bound = round(pred_kg + margin, 2)

            return {
                "predicted_waste_kg": round(pred_kg, 2),
                "confidence_range_kg": [lower_bound, upper_bound],
                "uncertainty_margin_kg": margin,
                "model_version": model_ver,
                "model_name": model_type,
                "is_demo_fallback": False,
                "data_source": "Trained Scikit-Learn Pipeline on Kaggle Messy Food Waste Dataset",
                "validation_rmse_kg": rmse,
                "caveats": [
                    "Prediction represents expected unconsumed surplus based on planned attendance.",
                    f"Model standard error is ±{margin} kg on held-out 2024 institutional data.",
                    "Always maintain a minimum 5% safety buffer to prevent meal shortages.",
                ],
            }
        except Exception as e:
            logger.error("Error during pipeline prediction: %s. Using labeled fallback.", e)

    # Labeled fallback if model is missing or fails
    fallback_rate = 0.10  # 10% average rule of thumb
    fallback_pred = round(meals_planned * 0.4 * fallback_rate + past_waste_kg * 0.3, 2)
    return {
        "predicted_waste_kg": fallback_pred,
        "confidence_range_kg": [round(fallback_pred * 0.7, 2), round(fallback_pred * 1.3, 2)],
        "uncertainty_margin_kg": round(fallback_pred * 0.3, 2),
        "model_version": "fallback-demo-0.1",
        "model_name": "Deterministic Fallback Estimator (Rule-Based)",
        "is_demo_fallback": True,
        "data_source": "Demonstration Fallback (No trained model loaded)",
        "validation_rmse_kg": None,
        "caveats": [
            "DEMO ONLY: Trained ML model artifact was not loaded; using deterministic estimate.",
            "Do not cite these figures as validated statistical predictions.",
        ],
    }


if __name__ == "__main__":
    sample = predict_food_waste(
        meals_planned=350,
        kitchen_staff=12,
        temperature_C=24.5,
        humidity_percent=60.0,
        day_of_week=2,
        special_event=0,
        past_waste_kg=25.0,
        staff_experience="Intermediate",
        waste_category="Meat",
    )
    print(json.dumps(sample, indent=2))
