import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models import WasteLog, InventoryItem, SurplusListing
from backend.app.services.inventory_service import calculate_inventory_status
from backend.app.services.recommendations import generate_kitchen_recommendations
from ml.predict import predict_food_waste

from sqlalchemy.pool import StaticPool

# In-memory SQLite with StaticPool so all connections share the same memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# 1. Model Loading & Prediction Tests
def test_model_loading_and_prediction():
    res = predict_food_waste(
        meals_planned=300,
        kitchen_staff=10,
        temperature_C=25.0,
        humidity_percent=55.0,
        day_of_week=1,
        special_event=0,
        past_waste_kg=20.0,
        staff_experience="Intermediate",
        waste_category="Meat",
    )
    assert "predicted_waste_kg" in res
    assert res["predicted_waste_kg"] > 0
    assert len(res["confidence_range_kg"]) == 2
    assert res["confidence_range_kg"][0] <= res["predicted_waste_kg"] <= res["confidence_range_kg"][1]
    assert res["is_demo_fallback"] is False
    assert res["validation_rmse_kg"] is not None


def test_model_robustness_unexpected_inputs():
    # Test handling unexpected casing and non-standard category
    res = predict_food_waste(
        meals_planned=200,
        kitchen_staff=8,
        temperature_C=30.0,
        humidity_percent=70.0,
        day_of_week=4,
        special_event=1,
        past_waste_kg=15.0,
        staff_experience="EXPERT",
        waste_category="unknown_category_xyz",
    )
    assert res["predicted_waste_kg"] >= 0


# 2. Recommendation Engine & Safety Buffers
def test_kitchen_recommendation_safety_margin():
    recs = generate_kitchen_recommendations(
        dish_name="Chicken Curry",
        waste_category="Meat",
        planned_meals=400,
        portion_size_kg=0.35,
        predicted_waste_kg=35.0,
        past_waste_kg=28.0,
        safety_buffer_pct=0.05,
        kitchen_staff=14,
        special_event=0,
    )
    # Baseline: 400 * 0.35 = 140 kg
    assert recs["baseline_demand_kg"] == 140.0
    # Safety buffer must be positive (5% of 140 = 7.0 kg)
    assert recs["safety_buffer_kg"] == 7.0
    # Recommended prep must not starve diners
    assert recs["recommended_prep_kg"] >= 140.0 * 0.85
    assert len(recs["actionable_tips"]) > 0


# 3. Deterministic Inventory Expiry Tests
def test_inventory_expiry_status_rules():
    today = date(2026, 10, 16)

    # 1. Past date -> Expired
    days, status = calculate_inventory_status("2026-10-15", current_qty=20.0, min_threshold_qty=10.0, reference_date=today)
    assert days == -1
    assert status == "Expired"

    # 2. Within 3 days -> Expiring Soon
    days, status = calculate_inventory_status("2026-10-18", current_qty=20.0, min_threshold_qty=10.0, reference_date=today)
    assert days == 2
    assert status == "Expiring Soon"

    # 3. Low stock (quantity <= threshold) -> Low Stock
    days, status = calculate_inventory_status("2026-11-20", current_qty=5.0, min_threshold_qty=10.0, reference_date=today)
    assert days > 3
    assert status == "Low Stock"

    # 4. Safe stock
    days, status = calculate_inventory_status("2026-11-20", current_qty=50.0, min_threshold_qty=10.0, reference_date=today)
    assert status == "Safe"


# 4. API Endpoints: Health Check
def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True


# 5. Waste Logs CRUD & Calculation Accuracy
def test_waste_log_create_and_validation(client):
    # Valid log creation
    payload = {
        "date": "2026-10-16",
        "meal_type": "Lunch",
        "food_item": "Chicken Biryani",
        "waste_category": "Meat",
        "prepared_kg": 150.0,
        "served_kg": 132.0,
        "waste_type": "Edible Surplus",
        "waste_reason": "Overpreparation",
        "cost_per_kg": 4.50,
        "notes": "Test lunch log",
    }
    res = client.post("/api/waste-logs", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] is not None
    # Auto-calculated leftover: 150 - 132 = 18.0
    assert data["leftover_kg"] == 18.0

    # Fetch list
    list_res = client.get("/api/waste-logs")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Invalid payload: negative prepared quantity
    bad_payload = payload.copy()
    bad_payload["prepared_kg"] = -10.0
    bad_res = client.post("/api/waste-logs", json=bad_payload)
    assert bad_res.status_code == 422


# 6. Inventory CRUD
def test_inventory_crud_flow(client):
    payload = {
        "ingredient_name": "Paneer",
        "category": "Dairy",
        "current_qty": 25.0,
        "unit": "kg",
        "batch_number": "BAT-TST-001",
        "received_date": "2026-10-14",
        "expiry_date": "2026-10-28",
        "min_threshold_qty": 10.0,
        "storage_location": "Walk-in Cooler",
        "cost_per_unit": 4.00,
    }
    res = client.post("/api/inventory", json=payload)
    assert res.status_code == 201
    item_id = res.json()["id"]
    assert res.json()["alert_status"] == "Safe"

    # Update quantity to trigger Low Stock
    patch_res = client.patch(f"/api/inventory/{item_id}", json={"current_qty": 5.0})
    assert patch_res.status_code == 200
    assert patch_res.json()["alert_status"] == "Low Stock"

    # Delete
    del_res = client.delete(f"/api/inventory/{item_id}")
    assert del_res.status_code == 204


# 7. Surplus Listing Eligibility & State Transitions
def test_surplus_listing_eligibility_and_workflow(client):
    # Create listing in pending_review
    payload = {
        "title": "Steamed Rice & Dal",
        "food_category": "Grains",
        "quantity_kg": 15.0,
        "servings_estimate": 40,
        "prepared_time": "2026-10-16 13:00",
        "collection_deadline": "2026-10-16 16:30",
        "review_status": "pending_review",
    }
    create_res = client.post("/api/surplus-listings", json=payload)
    assert create_res.status_code == 201
    listing_id = create_res.json()["id"]
    assert create_res.json()["status"] == "pending_review"

    # Attempt to publish as available without approval -> must fail
    fail_pub = client.patch(
        f"/api/surplus-listings/{listing_id}/status",
        json={"status": "available", "review_status": "rejected"},
    )
    assert fail_pub.status_code == 400

    # Staff approval -> publication as available succeeds
    approve_res = client.patch(
        f"/api/surplus-listings/{listing_id}/status",
        json={
            "status": "available",
            "review_status": "approved",
            "approval_staff_name": "Head Chef Ramesh",
        },
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "available"

    # Claim listing with recipient info
    claim_res = client.patch(
        f"/api/surplus-listings/{listing_id}/status",
        json={
            "status": "claimed",
            "recipient_name": "Kavita Rao",
            "recipient_contact": "+91 99887 76655",
            "recipient_organization": "City Relief NGO",
        },
    )
    assert claim_res.status_code == 200
    assert claim_res.json()["status"] == "claimed"

    # Complete collection
    collect_res = client.patch(
        f"/api/surplus-listings/{listing_id}/status",
        json={
            "status": "collected",
            "verification_notes": "Pickup verified by mess supervisor on duty.",
        },
    )
    assert collect_res.status_code == 200
    assert collect_res.json()["status"] == "collected"


# 8. Dashboard Summary Math & Integrity
def test_dashboard_summary_calculations(client, db_session):
    # Insert known waste records
    w1 = WasteLog(
        date="2026-10-15",
        meal_type="Lunch",
        food_item="Dish 1",
        waste_category="Grains",
        prepared_kg=100.0,
        served_kg=80.0,
        leftover_kg=20.0,
        waste_type="Edible Surplus",
        cost_per_kg=2.00,
    )
    w2 = WasteLog(
        date="2026-10-15",
        meal_type="Dinner",
        food_item="Dish 2",
        waste_category="Meat",
        prepared_kg=100.0,
        served_kg=90.0,
        leftover_kg=10.0,
        waste_type="Plate Waste",
        cost_per_kg=5.00,
    )
    db_session.add_all([w1, w2])
    db_session.commit()

    summary_res = client.get("/api/dashboard/summary")
    assert summary_res.status_code == 200
    data = summary_res.json()

    assert data["total_prepared_kg"] == 200.0
    assert data["total_served_kg"] == 170.0
    assert data["total_leftover_kg"] == 30.0
    # Waste rate = (30 / 200) * 100 = 15.0%
    assert data["waste_rate_percent"] == 15.0
    # Cost = 20 * 2.00 + 10 * 5.00 = 40 + 50 = 90.00
    assert data["total_food_cost_wasted"] == 90.00
    # Edible surplus = 20.0
    assert data["edible_surplus_kg"] == 20.0


# 9. Manager Override Audit Trail & History
def test_manager_override_logging_and_history(client):
    override_payload = {
        "dish_name": "Paneer Butter Masala",
        "category": "Dairy",
        "planned_meals": 350,
        "kitchen_staff": 12,
        "temperature_c": 26.0,
        "humidity_pct": 60.0,
        "day_of_week": 3,
        "special_event": 0,
        "past_waste_kg": 18.0,
        "staff_experience": "Intermediate",
        "predicted_waste_kg": 22.5,
        "recommended_prep_kg": 115.0,
        "safety_buffer_kg": 6.1,
        "recommendation_reason": "Baseline recommendation with 5% safety buffer",
        "override_prep_kg": 125.0,
        "override_reason": "Extra hostel wing checking in for evening sports tournament",
    }
    res = client.post("/api/predict-waste/override", json=override_payload)
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert res.json()["override_prep_kg"] == 125.0

    # Retrieve history
    hist_res = client.get("/api/predict-waste/history")
    assert hist_res.status_code == 200
    records = hist_res.json()
    assert len(records) >= 1
    assert any(r["override_reason"] == "Extra hostel wing checking in for evening sports tournament" for r in records)


# 10. Model Metrics Endpoint Verification
def test_model_metrics_report_endpoint(client):
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "metadata" in data
    assert "model_comparison" in data
    assert "selected_model_metrics" in data
    assert data["metadata"]["target_variable"] == "food_waste_kg"
    assert data["selected_model_metrics"]["rmse"] > 0


# 11. Waste Log Boundary Violations
def test_waste_log_boundary_rejections(client):
    # Implausible served quantity (served > 1.2 * prepared)
    bad_payload = {
        "date": "2026-10-16",
        "meal_type": "Dinner",
        "food_item": "Dal Tadka",
        "waste_category": "Grains",
        "prepared_kg": 50.0,
        "served_kg": 100.0,  # 200% of prepared
    }
    res = client.post("/api/waste-logs", json=bad_payload)
    assert res.status_code == 400
    assert "implausibly exceed" in res.json()["detail"]


# 12. 404 Handlers for Nonexistent Records
def test_not_found_handling(client):
    assert client.delete("/api/waste-logs/999999").status_code == 404
    assert client.delete("/api/inventory/999999").status_code == 404
    assert client.patch("/api/inventory/999999", json={"current_qty": 10}).status_code == 404
    assert client.delete("/api/surplus-listings/999999").status_code == 404
    assert client.patch("/api/surplus-listings/999999/status", json={"status": "available"}).status_code == 404

