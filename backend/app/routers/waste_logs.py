from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models import WasteLog
from backend.app.schemas import WasteLogCreate, WasteLogResponse

router = APIRouter(prefix="/waste-logs", tags=["Waste Logs"])


@router.get("", response_model=List[WasteLogResponse])
def list_waste_logs(
    category: Optional[str] = Query(None, description="Filter by category (Meat, Dairy, Vegetables, Grains)"),
    meal_type: Optional[str] = Query(None, description="Filter by meal type (Breakfast, Lunch, Dinner, Snack)"),
    waste_type: Optional[str] = Query(None, description="Filter by waste type (Edible Surplus, Plate Waste, Prep Spoilage)"),
    db: Session = Depends(get_db),
):
    query = db.query(WasteLog)
    if category:
        query = query.filter(WasteLog.waste_category.ilike(f"%{category}%"))
    if meal_type:
        query = query.filter(WasteLog.meal_type.ilike(f"%{meal_type}%"))
    if waste_type:
        query = query.filter(WasteLog.waste_type.ilike(f"%{waste_type}%"))

    logs = query.order_by(WasteLog.date.desc(), WasteLog.id.desc()).all()
    return logs


@router.post("", response_model=WasteLogResponse, status_code=201)
def create_waste_log(log_in: WasteLogCreate, db: Session = Depends(get_db)):
    # Validate quantities
    if log_in.prepared_kg <= 0:
        raise HTTPException(status_code=400, detail="Prepared quantity must be greater than 0 kg.")
    if log_in.served_kg < 0:
        raise HTTPException(status_code=400, detail="Served quantity cannot be negative.")
    if log_in.served_kg > log_in.prepared_kg * 1.2:
        raise HTTPException(
            status_code=400,
            detail=f"Served quantity ({log_in.served_kg} kg) cannot implausibly exceed prepared quantity ({log_in.prepared_kg} kg).",
        )

    leftover = log_in.leftover_kg
    if leftover is None:
        leftover = max(0.0, round(log_in.prepared_kg - log_in.served_kg, 2))

    log_entry = WasteLog(
        date=log_in.date,
        meal_type=log_in.meal_type,
        food_item=log_in.food_item,
        waste_category=log_in.waste_category.capitalize(),
        prepared_kg=round(log_in.prepared_kg, 2),
        served_kg=round(log_in.served_kg, 2),
        leftover_kg=round(leftover, 2),
        waste_type=log_in.waste_type,
        waste_reason=log_in.waste_reason,
        cost_per_kg=round(log_in.cost_per_kg, 2),
        notes=log_in.notes,
    )
    try:
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error saving waste log: {str(e)}")


@router.delete("/{log_id}", status_code=204)
def delete_waste_log(log_id: int, db: Session = Depends(get_db)):
    item = db.query(WasteLog).filter(WasteLog.id == log_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Waste log record #{log_id} not found.")
    try:
        db.delete(item)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error deleting waste log: {str(e)}")
