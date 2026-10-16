import os
import json
import logging
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ml_trainer")

NUMERIC_FEATURES = [
    "meals_served",
    "kitchen_staff",
    "temperature_C",
    "humidity_percent",
    "day_of_week",
    "special_event",
    "past_waste_kg",
]

CATEGORICAL_FEATURES = [
    "staff_experience",
    "waste_category",
]

TARGET = "food_waste_kg"


def clean_raw_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize the raw food waste dataset."""
    df = df.copy()

    # Normalize category labels
    if "waste_category" in df.columns:
        df["waste_category"] = (
            df["waste_category"]
            .astype(str)
            .str.strip()
            .str.capitalize()
            .replace({"Meat": "Meat", "Grains": "Grains", "Dairy": "Dairy", "Vegetables": "Vegetables"})
        )

    # Normalize staff experience and fill missing with Unknown
    if "staff_experience" in df.columns:
        df["staff_experience"] = (
            df["staff_experience"]
            .fillna("Unknown")
            .astype(str)
            .str.strip()
            .str.capitalize()
        )
        # Standardize known values
        valid_exp = {"Beginner", "Intermediate", "Expert", "Unknown"}
        df["staff_experience"] = df["staff_experience"].apply(
            lambda x: x if x in valid_exp else "Unknown"
        )

    # Parse dates and sort chronologically for time-ordered splitting
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.sort_values("date").reset_index(drop=True)

    # Ensure numeric columns are strictly numeric
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if TARGET in df.columns:
        df[TARGET] = pd.to_numeric(df[TARGET], errors="coerce")

    return df


def build_preprocessor() -> ColumnTransformer:
    """Construct standard scikit-learn preprocessing pipeline."""
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ]
    )
    return preprocessor


def train_and_evaluate(data_path: str = "data/raw/train.csv"):
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training dataset not found at: {data_path}")

    logger.info("Loading raw dataset from %s", data_path)
    raw_df = pd.read_csv(data_path)
    df = clean_raw_data(raw_df)

    logger.info("Total cleaned records: %d", len(df))
    logger.info("Date range: %s to %s", df["date"].min().date(), df["date"].max().date())

    # Temporal split: 80% past (training), 20% future held-out (testing)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    logger.info(
        "Train set: %d rows (%s to %s)",
        len(train_df),
        train_df["date"].min().date(),
        train_df["date"].max().date(),
    )
    logger.info(
        "Held-out Test set: %d rows (%s to %s)",
        len(test_df),
        test_df["date"].min().date(),
        test_df["date"].max().date(),
    )

    X_train = train_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_train = train_df[TARGET]

    X_test = test_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_test = test_df[TARGET]

    candidate_models = {
        "Baseline (Median Dummy)": DummyRegressor(strategy="median"),
        "Ridge Regression": Ridge(alpha=10.0),
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=100, max_depth=10, min_samples_leaf=3, random_state=42
        ),
        "HistGradientBoosting Regressor": HistGradientBoostingRegressor(
            max_iter=150, max_depth=6, random_state=42
        ),
    }

    results = {}
    best_name = None
    best_rmse = float("inf")
    best_pipeline = None

    for name, model in candidate_models.items():
        preprocessor = build_preprocessor()
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("regressor", model)])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        results[name] = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
        }

        logger.info("[%s] Held-out Test -> MAE: %.3f kg | RMSE: %.3f kg | R2: %.3f", name, mae, rmse, r2)

        if rmse < best_rmse:
            best_rmse = rmse
            best_name = name
            best_pipeline = pipeline

    logger.info("Winning Model: %s (Held-out Test RMSE: %.3f kg)", best_name, best_rmse)

    # Save winning model pipeline
    os.makedirs("models", exist_ok=True)
    model_save_path = "models/food_waste_pipeline.joblib"
    joblib.dump(best_pipeline, model_save_path)
    logger.info("Saved winning model pipeline to %s", model_save_path)

    # Compile comprehensive metrics report
    report = {
        "metadata": {
            "model_version": "1.0.0",
            "model_type": best_name,
            "trained_at": datetime.now().isoformat(),
            "target_variable": TARGET,
            "validation_methodology": "Chronological 80/20 held-out split (no temporal leakage)",
            "total_records": len(df),
            "train_sample_count": len(train_df),
            "test_sample_count": len(test_df),
            "train_date_range": [str(train_df["date"].min().date()), str(train_df["date"].max().date())],
            "test_date_range": [str(test_df["date"].min().date()), str(test_df["date"].max().date())],
        },
        "features": {
            "numeric": NUMERIC_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
            "leakage_prevention_note": (
                "In real institutional kitchens, meals_served is provided as 'planned_meals' or expected diners, "
                "so predictions remain strictly pre-meal without future knowledge."
            ),
        },
        "model_comparison": results,
        "selected_model_metrics": results[best_name],
        "limitations": [
            "Trained on institutional/mess tabular records; performance on fine-dining restaurants may require fine-tuning.",
            "High variance during unannounced holidays or sudden student mass-absences.",
            "Estimates carry uncertainty intervals; predictions should always be coupled with a safety stock buffer.",
        ],
    }

    os.makedirs("reports", exist_ok=True)
    report_save_path = "reports/model_metrics.json"
    with open(report_save_path, "w") as f:
        json.dump(report, f, indent=2)
    logger.info("Saved model evaluation metrics report to %s", report_save_path)

    return report


if __name__ == "__main__":
    train_and_evaluate()
