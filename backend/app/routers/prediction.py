from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas import (
    PredictionRequest,
    PredictionResponse,
    ManagerOverrideRequest,
)
from backend.app.models import PredictionLog
from backend.app.services.recommendations import generate_kitchen_recommendations
from ml.predict import predict_food_waste

router = APIRouter(prefix="/predict-waste", tags=["Prediction & Recommendations"])


@router.post("", response_model=PredictionResponse)
def predict_waste(req: PredictionRequest, db: Session = Depends(get_db)):
    try:
        # Run ML model inference
        ml_result = predict_food_waste(
            meals_planned=req.planned_meals,
            kitchen_staff=req.kitchen_staff,
            temperature_C=req.temperature_C,
            humidity_percent=req.humidity_percent,
            day_of_week=req.day_of_week,
            special_event=req.special_event,
            past_waste_kg=req.past_waste_kg,
            staff_experience=req.staff_experience,
            waste_category=req.waste_category,
        )

        # Generate transparent kitchen recommendations
        recs = generate_kitchen_recommendations(
            dish_name=req.dish_name,
            waste_category=req.waste_category,
            planned_meals=req.planned_meals,
            portion_size_kg=req.portion_size_kg,
            predicted_waste_kg=ml_result["predicted_waste_kg"],
            past_waste_kg=req.past_waste_kg,
            safety_buffer_pct=req.safety_buffer_pct,
            kitchen_staff=req.kitchen_staff,
            special_event=req.special_event,
        )

        # Log prediction to database
        db_log = PredictionLog(
            dish_name=req.dish_name,
            category=req.waste_category,
            planned_meals=req.planned_meals,
            kitchen_staff=req.kitchen_staff,
            temperature_c=req.temperature_C,
            humidity_pct=req.humidity_percent,
            day_of_week=req.day_of_week,
            special_event=req.special_event,
            past_waste_kg=req.past_waste_kg,
            staff_experience=req.staff_experience,
            predicted_waste_kg=ml_result["predicted_waste_kg"],
            recommended_prep_kg=recs["recommended_prep_kg"],
            safety_buffer_kg=recs["safety_buffer_kg"],
            recommendation_reason=recs["recommendation_reason"],
            manager_override=False,
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)

        return PredictionResponse(
            dish_name=req.dish_name,
            planned_meals=req.planned_meals,
            predicted_waste_kg=ml_result["predicted_waste_kg"],
            confidence_range_kg=ml_result["confidence_range_kg"],
            uncertainty_margin_kg=ml_result["uncertainty_margin_kg"],
            model_version=ml_result["model_version"],
            model_name=ml_result["model_name"],
            is_demo_fallback=ml_result["is_demo_fallback"],
            validation_rmse_kg=ml_result["validation_rmse_kg"],
            recommended_prep_kg=recs["recommended_prep_kg"],
            safety_buffer_kg=recs["safety_buffer_kg"],
            recommendation_reason=recs["recommendation_reason"],
            actionable_tips=recs["actionable_tips"],
            operational_caveats=ml_result["caveats"],
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/override")
def record_manager_override(req: ManagerOverrideRequest, db: Session = Depends(get_db)):
    try:
        log = PredictionLog(
            dish_name=req.dish_name,
            category=req.category,
            planned_meals=req.planned_meals,
            kitchen_staff=req.kitchen_staff,
            temperature_c=req.temperature_c,
            humidity_pct=req.humidity_pct,
            day_of_week=req.day_of_week,
            special_event=req.special_event,
            past_waste_kg=req.past_waste_kg,
            staff_experience=req.staff_experience,
            predicted_waste_kg=req.predicted_waste_kg,
            recommended_prep_kg=req.recommended_prep_kg,
            safety_buffer_kg=req.safety_buffer_kg,
            recommendation_reason=req.recommendation_reason,
            manager_override=True,
            override_prep_kg=req.override_prep_kg,
            override_reason=req.override_reason,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return {
            "status": "success",
            "message": "Manager override logged with audit trail.",
            "id": log.id,
            "dish_name": log.dish_name,
            "override_prep_kg": log.override_prep_kg,
            "override_reason": log.override_reason,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Override error: {str(e)}")


@router.get("/history")
def get_prediction_history(db: Session = Depends(get_db)):
    logs = (
        db.query(PredictionLog)
        .order_by(PredictionLog.id.desc())
        .limit(20)
        .all()
    )
    return logs
