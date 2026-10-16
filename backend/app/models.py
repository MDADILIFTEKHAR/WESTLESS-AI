from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
    DateTime,
    Text,
)
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class WasteLog(Base):
    __tablename__ = "waste_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    meal_type = Column(String(50), nullable=False)  # Breakfast, Lunch, Dinner, Snack
    food_item = Column(String(100), nullable=False)
    waste_category = Column(String(50), nullable=False)  # Meat, Dairy, Vegetables, Grains
    prepared_kg = Column(Float, nullable=False)
    served_kg = Column(Float, nullable=False)
    leftover_kg = Column(Float, nullable=False)
    waste_type = Column(String(50), nullable=False, default="Edible Surplus")  # Edible Surplus, Plate Waste, Prep Spoilage
    waste_reason = Column(String(100), nullable=True)  # Overpreparation, Low Attendance, etc.
    cost_per_kg = Column(Float, nullable=False, default=2.50)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # Grains, Meat, Dairy, Vegetables, Dry Goods
    current_qty = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="kg")
    batch_number = Column(String(50), nullable=False)
    received_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    expiry_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    min_threshold_qty = Column(Float, nullable=False, default=10.0)
    storage_location = Column(String(100), nullable=True)
    cost_per_unit = Column(Float, nullable=False, default=2.00)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class SurplusListing(Base):
    __tablename__ = "surplus_listings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    food_category = Column(String(50), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    servings_estimate = Column(Integer, nullable=False)
    prepared_time = Column(String(30), nullable=False)
    collection_deadline = Column(String(30), nullable=False)
    allergens = Column(String(200), nullable=True, default="None listed")
    dietary_info = Column(String(100), nullable=True, default="Standard")  # Vegetarian, Halal, etc.
    storage_condition = Column(String(150), nullable=True, default="Room temperature / hot holding")
    review_status = Column(String(30), nullable=False, default="pending_review")  # pending_review, approved, rejected
    approval_staff_name = Column(String(100), nullable=True)
    status = Column(String(30), nullable=False, default="pending_review")  # pending_review, available, claimed, collected, expired, cancelled
    recipient_name = Column(String(100), nullable=True)
    recipient_contact = Column(String(50), nullable=True)
    recipient_organization = Column(String(120), nullable=True)
    claimed_at = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    is_demo_workflow = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utc_now)


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now)
    dish_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    planned_meals = Column(Integer, nullable=False)
    kitchen_staff = Column(Integer, nullable=False)
    temperature_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    special_event = Column(Integer, nullable=False)
    past_waste_kg = Column(Float, nullable=False)
    staff_experience = Column(String(50), nullable=False)
    predicted_waste_kg = Column(Float, nullable=False)
    recommended_prep_kg = Column(Float, nullable=False)
    safety_buffer_kg = Column(Float, nullable=False)
    recommendation_reason = Column(Text, nullable=False)
    manager_override = Column(Boolean, default=False)
    override_prep_kg = Column(Float, nullable=True)
    override_reason = Column(Text, nullable=True)
