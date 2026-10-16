import os
import sys
import json
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.train_model import clean_raw_data, NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ml_evaluator")


def evaluate_pipeline(
    model_path: str = "models/food_waste_pipeline.joblib",
    data_path: str = "data/raw/train.csv",
):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Evaluation data not found at: {data_path}")

    logger.info("Loading model pipeline from %s", model_path)
    pipeline = joblib.load(model_path)

    logger.info("Loading evaluation dataset from %s", data_path)
    raw_df = pd.read_csv(data_path)
    df = clean_raw_data(raw_df)

    split_idx = int(len(df) * 0.8)
    test_df = df.iloc[split_idx:].copy()

    X_test = test_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_test = test_df[TARGET]

    y_pred = pipeline.predict(X_test)
    residuals = y_test - y_pred

    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))
    mean_residual = float(np.mean(residuals))
    std_residual = float(np.std(residuals))

    # Evaluate by waste_category
    test_df["predicted_waste_kg"] = y_pred
    test_df["error_kg"] = np.abs(residuals)

    category_breakdown = {}
    for cat, group in test_df.groupby("waste_category"):
        cat_mae = float(mean_absolute_error(group[TARGET], group["predicted_waste_kg"]))
        category_breakdown[cat] = {
            "samples": len(group),
            "mae_kg": round(cat_mae, 3),
            "mean_actual_kg": round(float(group[TARGET].mean()), 3),
            "mean_pred_kg": round(float(group["predicted_waste_kg"].mean()), 3),
        }

    evaluation_summary = {
        "overall_held_out_metrics": {
            "test_samples": len(test_df),
            "mae_kg": round(mae, 4),
            "rmse_kg": round(rmse, 4),
            "r2": round(r2, 4),
            "mean_bias_kg": round(mean_residual, 4),
            "std_error_kg": round(std_residual, 4),
        },
        "by_category_performance": category_breakdown,
    }

    logger.info("Held-out Test MAE: %.3f kg | RMSE: %.3f kg | R2: %.3f", mae, rmse, r2)
    print(json.dumps(evaluation_summary, indent=2))
    return evaluation_summary


if __name__ == "__main__":
    evaluate_pipeline()
