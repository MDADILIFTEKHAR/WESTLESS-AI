from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from backend.app.database import get_db
from backend.app.models import InventoryItem
from backend.app.schemas import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
)
from backend.app.services.inventory_service import calculate_inventory_status

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def map_item_to_response(item: InventoryItem, today: date) -> InventoryItemResponse:
    days, status = calculate_inventory_status(
        item.expiry_date, item.current_qty, item.min_threshold_qty, reference_date=today
    )
    return InventoryItemResponse(
        id=item.id,
        ingredient_name=item.ingredient_name,
        category=item.category,
        current_qty=item.current_qty,
        unit=item.unit,
        batch_number=item.batch_number,
        received_date=item.received_date,
        expiry_date=item.expiry_date,
        min_threshold_qty=item.min_threshold_qty,
        storage_location=item.storage_location,
        cost_per_unit=item.cost_per_unit,
        notes=item.notes,
        created_at=item.created_at,
        days_to_expiry=days,
        alert_status=status,
    )


@router.get("", response_model=List[InventoryItemResponse])
def list_inventory(
    status_filter: Optional[str] = Query(None, description="Filter by alert status (Safe, Expiring Soon, Expired, Low Stock)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    query = db.query(InventoryItem)
    if category:
        query = query.filter(InventoryItem.category.ilike(f"%{category}%"))

    items = query.order_by(InventoryItem.expiry_date.asc()).all()
    today = date.today()

    responses = [map_item_to_response(i, today) for i in items]
    if status_filter:
        responses = [r for r in responses if r.alert_status.lower() == status_filter.lower()]

    return responses


@router.post("", response_model=InventoryItemResponse, status_code=201)
def add_inventory_item(item_in: InventoryItemCreate, db: Session = Depends(get_db)):
    item = InventoryItem(
        ingredient_name=item_in.ingredient_name,
        category=item_in.category,
        current_qty=round(item_in.current_qty, 2),
        unit=item_in.unit,
        batch_number=item_in.batch_number,
        received_date=item_in.received_date,
        expiry_date=item_in.expiry_date,
        min_threshold_qty=round(item_in.min_threshold_qty, 2),
        storage_location=item_in.storage_location,
        cost_per_unit=round(item_in.cost_per_unit, 2),
        notes=item_in.notes,
    )
    try:
        db.add(item)
        db.commit()
        db.refresh(item)
        return map_item_to_response(item, date.today())
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error saving inventory item: {str(e)}")


@router.patch("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int, item_up: InventoryItemUpdate, db: Session = Depends(get_db)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Inventory item #{item_id} not found.")

    update_data = item_up.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(item, field, val)

    try:
        db.commit()
        db.refresh(item)
        return map_item_to_response(item, date.today())
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error updating inventory item: {str(e)}")


@router.delete("/{item_id}", status_code=204)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Inventory item #{item_id} not found.")
    try:
        db.delete(item)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error deleting inventory item: {str(e)}")
