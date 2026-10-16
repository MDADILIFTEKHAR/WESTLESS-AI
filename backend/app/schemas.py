from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


# --- PREDICTION SCHEMAS ---
class PredictionRequest(BaseModel):
    dish_name: str = Field(..., json_schema_extra={"example": "Chicken Biryani"}, min_length=2)
    planned_meals: int = Field(..., ge=1, le=10000, description="Pre-meal planned meals or booked attendance scale")
    kitchen_staff: int = Field(12, ge=1, le=50, description="Active kitchen staff on duty")
    temperature_C: float = Field(24.0, ge=-30.0, le=65.0, description="Ambient kitchen / local temperature")
    humidity_percent: float = Field(55.0, ge=0.0, le=100.0, description="Ambient humidity percentage")
    day_of_week: int = Field(2, ge=0, le=6, description="0=Monday, 6=Sunday")
    special_event: int = Field(0, ge=0, le=1, description="1 if holiday / feast / special event, 0 otherwise")
    past_waste_kg: float = Field(20.0, ge=0.0, le=200.0, description="Historical average waste for this dish")
    staff_experience: str = Field("Intermediate", description="Beginner, Intermediate, Expert, or Unknown")
    waste_category: str = Field("Meat", description="Meat, Dairy, Vegetables, Grains")
    portion_size_kg: float = Field(0.35, ge=0.1, le=2.0, description="Target portion weight per meal in kg")
    safety_buffer_pct: float = Field(0.05, ge=0.02, le=0.25, description="Safety buffer margin (default 5%)")


class PredictionResponse(BaseModel):
    dish_name: str
    planned_meals: int
    predicted_waste_kg: float
    confidence_range_kg: List[float]
    uncertainty_margin_kg: float
    model_version: str
    model_name: str
    is_demo_fallback: bool
    validation_rmse_kg: Optional[float]
    recommended_prep_kg: float
    safety_buffer_kg: float
    recommendation_reason: str
    actionable_tips: List[str]
    operational_caveats: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ManagerOverrideRequest(BaseModel):
    dish_name: str
    category: str
    planned_meals: int
    kitchen_staff: int
    temperature_c: float
    humidity_pct: float
    day_of_week: int
    special_event: int
    past_waste_kg: float
    staff_experience: str
    predicted_waste_kg: float
    recommended_prep_kg: float
    safety_buffer_kg: float
    recommendation_reason: str
    override_prep_kg: float = Field(..., gt=0)
    override_reason: str = Field(..., min_length=3)


# --- WASTE LOG SCHEMAS ---
class WasteLogCreate(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", json_schema_extra={"example": "2026-10-15"})
    meal_type: str = Field("Lunch", json_schema_extra={"example": "Lunch"})
    food_item: str = Field(..., min_length=2, json_schema_extra={"example": "Vegetable Pulao"})
    waste_category: str = Field(..., json_schema_extra={"example": "Grains"})
    prepared_kg: float = Field(..., gt=0, json_schema_extra={"example": 120.0})
    served_kg: float = Field(..., ge=0, json_schema_extra={"example": 105.0})
    leftover_kg: Optional[float] = Field(None, ge=0, json_schema_extra={"example": 15.0})
    waste_type: str = Field("Edible Surplus", json_schema_extra={"example": "Edible Surplus"})
    waste_reason: Optional[str] = Field("Overpreparation", json_schema_extra={"example": "Overpreparation"})
    cost_per_kg: float = Field(2.50, ge=0.0)
    notes: Optional[str] = None

    @field_validator("leftover_kg", mode="after")
    @classmethod
    def validate_or_calculate_leftover(cls, v, info):
        prep = info.data.get("prepared_kg")
        serv = info.data.get("served_kg")
        if v is None and prep is not None and serv is not None:
            return max(0.0, round(prep - serv, 2))
        return v


class WasteLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: str
    meal_type: str
    food_item: str
    waste_category: str
    prepared_kg: float
    served_kg: float
    leftover_kg: float
    waste_type: str
    waste_reason: Optional[str]
    cost_per_kg: float
    notes: Optional[str]
    created_at: datetime


# --- INVENTORY SCHEMAS ---
class InventoryItemCreate(BaseModel):
    ingredient_name: str = Field(..., min_length=2, json_schema_extra={"example": "Basmati Rice"})
    category: str = Field(..., json_schema_extra={"example": "Grains"})
    current_qty: float = Field(..., ge=0, json_schema_extra={"example": 75.0})
    unit: str = Field("kg", json_schema_extra={"example": "kg"})
    batch_number: str = Field(..., json_schema_extra={"example": "BATCH-2026-09A"})
    received_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", json_schema_extra={"example": "2026-10-10"})
    expiry_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", json_schema_extra={"example": "2026-10-25"})
    min_threshold_qty: float = Field(15.0, ge=0)
    storage_location: Optional[str] = Field("Dry Pantry Shelf 2", json_schema_extra={"example": "Dry Pantry"})
    cost_per_unit: float = Field(2.00, ge=0)
    notes: Optional[str] = None


class InventoryItemUpdate(BaseModel):
    ingredient_name: Optional[str] = None
    category: Optional[str] = None
    current_qty: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = None
    batch_number: Optional[str] = None
    received_date: Optional[str] = None
    expiry_date: Optional[str] = None
    min_threshold_qty: Optional[float] = None
    storage_location: Optional[str] = None
    cost_per_unit: Optional[float] = None
    notes: Optional[str] = None


class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ingredient_name: str
    category: str
    current_qty: float
    unit: str
    batch_number: str
    received_date: str
    expiry_date: str
    min_threshold_qty: float
    storage_location: Optional[str]
    cost_per_unit: float
    notes: Optional[str]
    created_at: datetime
    # Calculated deterministic status
    days_to_expiry: int
    alert_status: str  # Safe, Expiring Soon, Expired, Low Stock


# --- SURPLUS RESCUE SCHEMAS ---
class SurplusListingCreate(BaseModel):
    title: str = Field(..., min_length=3, json_schema_extra={"example": "Fresh Cooked Dal & Rice"})
    food_category: str = Field("Grains", json_schema_extra={"example": "Grains"})
    quantity_kg: float = Field(..., gt=0, json_schema_extra={"example": 18.5})
    servings_estimate: int = Field(..., ge=1, json_schema_extra={"example": 50})
    prepared_time: str = Field(..., json_schema_extra={"example": "2026-10-16 13:30"})
    collection_deadline: str = Field(..., json_schema_extra={"example": "2026-10-16 17:00"})
    allergens: Optional[str] = Field("None listed", json_schema_extra={"example": "None"})
    dietary_info: Optional[str] = Field("Vegetarian", json_schema_extra={"example": "Vegetarian"})
    storage_condition: Optional[str] = Field("Kept in hot-holding cabinet >65°C")
    review_status: str = Field("pending_review")
    approval_staff_name: Optional[str] = None


class SurplusStatusUpdate(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "claimed"})  # pending_review, available, claimed, collected, expired, cancelled
    review_status: Optional[str] = None  # approved, rejected
    approval_staff_name: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_contact: Optional[str] = None
    recipient_organization: Optional[str] = None
    verification_notes: Optional[str] = None


class SurplusListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    food_category: str
    quantity_kg: float
    servings_estimate: int
    prepared_time: str
    collection_deadline: str
    allergens: Optional[str]
    dietary_info: Optional[str]
    storage_condition: Optional[str]
    review_status: str
    approval_staff_name: Optional[str]
    status: str
    recipient_name: Optional[str]
    recipient_contact: Optional[str]
    recipient_organization: Optional[str]
    claimed_at: Optional[datetime]
    collected_at: Optional[datetime]
    verification_notes: Optional[str]
    is_demo_workflow: bool
    created_at: datetime


# --- DASHBOARD & METRICS SCHEMAS ---
class DashboardSummaryResponse(BaseModel):
    total_prepared_kg: float
    total_served_kg: float
    total_leftover_kg: float
    waste_rate_percent: float
    total_food_cost_wasted: float
    edible_surplus_kg: float
    rescued_surplus_kg: float
    rescue_conversion_rate: float
    expiring_soon_items_count: int
    expired_items_count: int
    low_stock_items_count: int
    active_surplus_listings_count: int
    records_count: int
    model_status: Dict[str, Any]
    provenance: Dict[str, Any]
