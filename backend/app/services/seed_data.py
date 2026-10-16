from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from backend.app.models import WasteLog, InventoryItem, SurplusListing, PredictionLog


def seed_demo_database(db: Session, force: bool = False):
    """
    Seed initial realistic records for a college mess / institutional dining hall.
    """
    if not force and db.query(WasteLog).count() > 0:
        return {"status": "Database already contains operational records"}

    # Clear existing if forced
    if force:
        db.query(WasteLog).delete()
        db.query(InventoryItem).delete()
        db.query(SurplusListing).delete()
        db.query(PredictionLog).delete()
        db.commit()

    today = date.today()

    # 1. Seed Waste Logs for past 10 days
    sample_meals = [
        {"day_offset": -9, "meal": "Lunch", "dish": "Steamed Rice & Rajma", "cat": "Grains", "prep": 140.0, "serv": 122.0, "left": 18.0, "type": "Edible Surplus", "reason": "Overpreparation", "cost": 2.20},
        {"day_offset": -9, "meal": "Dinner", "dish": "Chicken Curry", "cat": "Meat", "prep": 110.0, "serv": 96.5, "left": 13.5, "type": "Edible Surplus", "reason": "Low Attendance", "cost": 4.50},
        {"day_offset": -8, "meal": "Lunch", "dish": "Paneer Butter Masala", "cat": "Dairy", "prep": 95.0, "serv": 88.0, "left": 7.0, "type": "Edible Surplus", "reason": "Portion Sizing", "cost": 3.80},
        {"day_offset": -8, "meal": "Dinner", "dish": "Vegetable Pulao", "cat": "Grains", "prep": 130.0, "serv": 112.0, "left": 18.0, "type": "Plate Waste", "reason": "Taste/Recipe", "cost": 2.10},
        {"day_offset": -7, "meal": "Lunch", "dish": "Egg Curry & Rice", "cat": "Meat", "prep": 125.0, "serv": 110.0, "left": 15.0, "type": "Edible Surplus", "reason": "Low Attendance", "cost": 3.20},
        {"day_offset": -7, "meal": "Dinner", "dish": "Mixed Dal Tadka", "cat": "Grains", "prep": 85.0, "serv": 74.0, "left": 11.0, "type": "Edible Surplus", "reason": "Overpreparation", "cost": 1.90},
        {"day_offset": -6, "meal": "Lunch", "dish": "Mutton Rogan Josh", "cat": "Meat", "prep": 150.0, "serv": 138.0, "left": 12.0, "type": "Edible Surplus", "reason": "Overpreparation", "cost": 6.00},
        {"day_offset": -6, "meal": "Dinner", "dish": "Kadai Paneer", "cat": "Dairy", "prep": 90.0, "serv": 78.0, "left": 12.0, "type": "Plate Waste", "reason": "Low Attendance", "cost": 3.90},
        {"day_offset": -5, "meal": "Lunch", "dish": "Vegetable Biryani", "cat": "Vegetables", "prep": 135.0, "serv": 120.0, "left": 15.0, "type": "Edible Surplus", "reason": "Overpreparation", "cost": 2.40},
        {"day_offset": -5, "meal": "Dinner", "dish": "Butter Chicken", "cat": "Meat", "prep": 120.0, "serv": 108.0, "left": 12.0, "type": "Edible Surplus", "reason": "Portion Sizing", "cost": 4.80},
        {"day_offset": -4, "meal": "Lunch", "dish": "Aloo Gobi & Roti", "cat": "Vegetables", "prep": 105.0, "serv": 98.0, "left": 7.0, "type": "Prep Spoilage", "reason": "Quality Issue", "cost": 1.60},
        {"day_offset": -4, "meal": "Dinner", "dish": "Dal Makhani & Naan", "cat": "Dairy", "prep": 115.0, "serv": 104.0, "left": 11.0, "type": "Edible Surplus", "reason": "Overpreparation", "cost": 2.80},
        {"day_offset": -3, "meal": "Lunch", "dish": "Fish Curry & Rice", "cat": "Meat", "prep": 100.0, "serv": 86.0, "left": 14.0, "type": "Edible Surplus", "reason": "Low Attendance", "cost": 5.20},
        {"day_offset": -3, "meal": "Dinner", "dish": "Chole Bhature", "cat": "Grains", "prep": 140.0, "serv": 128.0, "left": 12.0, "type": "Plate Waste", "reason": "Overpreparation", "cost": 2.30},
        {"day_offset": -2, "meal": "Lunch", "dish": "Sambar & Rice", "cat": "Vegetables", "prep": 120.0, "serv": 112.0, "left": 8.0, "type": "Edible Surplus", "reason": "Portion Sizing", "cost": 1.70},
        {"day_offset": -2, "meal": "Dinner", "dish": "Chicken Korma", "cat": "Meat", "prep": 115.0, "serv": 102.0, "left": 13.0, "type": "Edible Surplus", "reason": "Low Attendance", "cost": 4.60},
        {"day_offset": -1, "meal": "Lunch", "dish": "Matar Paneer", "cat": "Dairy", "prep": 100.0, "serv": 91.0, "left": 9.0, "type": "Edible Surplus", "reason": "Overpreparation", "cost": 3.70},
        {"day_offset": -1, "meal": "Dinner", "dish": "Jeera Rice & Dal Fry", "cat": "Grains", "prep": 130.0, "serv": 118.0, "left": 12.0, "type": "Edible Surplus", "reason": "Overpreparation", "cost": 2.00},
    ]

    for m in sample_meals:
        log_date = (today + timedelta(days=m["day_offset"])).isoformat()
        db.add(
            WasteLog(
                date=log_date,
                meal_type=m["meal"],
                food_item=m["dish"],
                waste_category=m["cat"],
                prepared_kg=m["prep"],
                served_kg=m["serv"],
                leftover_kg=m["left"],
                waste_type=m["type"],
                waste_reason=m["reason"],
                cost_per_kg=m["cost"],
                notes="Mess log recorded at closing of service.",
            )
        )

    # 2. Seed Inventory Items with varied dates & status
    inventory_samples = [
        {"name": "Basmati Rice (Premium)", "cat": "Grains", "qty": 180.0, "unit": "kg", "batch": "BAT-GR-101", "rec_offset": -15, "exp_offset": 45, "min_qty": 30.0, "loc": "Dry Pantry Bay 1", "cost": 1.80},
        {"name": "Fresh Whole Milk", "cat": "Dairy", "qty": 45.0, "unit": "L", "batch": "BAT-DR-204", "rec_offset": -2, "exp_offset": 1, "min_qty": 20.0, "loc": "Walk-in Cooler A", "cost": 1.20},
        {"name": "Boneless Chicken Breast", "cat": "Meat", "qty": 28.0, "unit": "kg", "batch": "BAT-MT-312", "rec_offset": -2, "exp_offset": 2, "min_qty": 15.0, "loc": "Freezer Unit 2", "cost": 5.50},
        {"name": "Fresh Paneer Blocks", "cat": "Dairy", "qty": 32.0, "unit": "kg", "batch": "BAT-DR-209", "rec_offset": -1, "exp_offset": 4, "min_qty": 10.0, "loc": "Walk-in Cooler B", "cost": 4.20},
        {"name": "Red Onions", "cat": "Vegetables", "qty": 8.0, "unit": "kg", "batch": "BAT-VG-405", "rec_offset": -10, "exp_offset": 12, "min_qty": 25.0, "loc": "Dry Veg Crate 3", "cost": 0.90},  # Low Stock
        {"name": "Fresh Tomatoes", "cat": "Vegetables", "qty": 35.0, "unit": "kg", "batch": "BAT-VG-409", "rec_offset": -3, "exp_offset": 5, "min_qty": 15.0, "loc": "Cold Store 1", "cost": 1.10},
        {"name": "Toor Dal (Yellow Lentils)", "cat": "Grains", "qty": 65.0, "unit": "kg", "batch": "BAT-GR-115", "rec_offset": -20, "exp_offset": 90, "min_qty": 20.0, "loc": "Dry Pantry Bay 2", "cost": 2.40},
        {"name": "Refined Sunflower Oil", "cat": "Dry Goods", "qty": 50.0, "unit": "L", "batch": "BAT-DG-501", "rec_offset": -30, "exp_offset": 120, "min_qty": 15.0, "loc": "Pantry Storage", "cost": 2.10},
        {"name": "Greek Style Plain Curd", "cat": "Dairy", "qty": 12.0, "unit": "kg", "batch": "BAT-DR-198", "rec_offset": -7, "exp_offset": -1, "min_qty": 8.0, "loc": "Cooler Shelf 3", "cost": 2.00},  # Expired
    ]

    for item in inventory_samples:
        rec_dt = (today + timedelta(days=item["rec_offset"])).isoformat()
        exp_dt = (today + timedelta(days=item["exp_offset"])).isoformat()
        db.add(
            InventoryItem(
                ingredient_name=item["name"],
                category=item["cat"],
                current_qty=item["qty"],
                unit=item["unit"],
                batch_number=item["batch"],
                received_date=rec_dt,
                expiry_date=exp_dt,
                min_threshold_qty=item["min_qty"],
                storage_location=item["loc"],
                cost_per_unit=item["cost"],
                notes="Standard mess kitchen verified inventory stock.",
            )
        )

    # 3. Seed Surplus Listings across states
    surplus_samples = [
        {
            "title": "Fresh Cooked Steamed Basmati Rice & Dal",
            "category": "Grains",
            "qty": 18.0,
            "servings": 45,
            "prep_time": f"{today.isoformat()} 13:30",
            "deadline": f"{today.isoformat()} 17:30",
            "allergens": "None",
            "dietary": "Vegetarian",
            "storage": "Hot holding cabinet (>65°C)",
            "review": "approved",
            "staff": "Chef Rajesh (Head Cook)",
            "status": "available",
            "recip_name": None,
            "recip_contact": None,
            "recip_org": None,
            "claimed_at": None,
            "collected_at": None,
            "verification": "Inspected and sealed by mess supervisor.",
        },
        {
            "title": "Prepared Chicken Biryani Portions",
            "category": "Meat",
            "qty": 22.5,
            "servings": 55,
            "prep_time": f"{today.isoformat()} 13:00",
            "deadline": f"{today.isoformat()} 17:00",
            "allergens": "Contains dairy",
            "dietary": "Halal",
            "storage": "Insulated food container",
            "review": "approved",
            "staff": "Chef Suresh",
            "status": "claimed",
            "recip_name": "Arjun Kumar",
            "recip_contact": "+91 98451 22334",
            "recip_org": "Robin Hood Army - City Chapter",
            "claimed_at": datetime.utcnow() - timedelta(minutes=45),
            "collected_at": None,
            "verification": "Recipient verified via volunteer ID. Pickup scheduled.",
        },
        {
            "title": "Assorted Chapatis & Aloo Matar Sabzi",
            "category": "Vegetables",
            "qty": 14.0,
            "servings": 40,
            "prep_time": f"{(today - timedelta(days=1)).isoformat()} 19:30",
            "deadline": f"{(today - timedelta(days=1)).isoformat()} 22:00",
            "allergens": "Gluten (Wheat)",
            "dietary": "Vegetarian",
            "storage": "Thermal insulated warmer",
            "review": "approved",
            "staff": "Supervisor Meena",
            "status": "collected",
            "recip_name": "Sana Sheikh",
            "recip_contact": "+91 97110 88992",
            "recip_org": "Community Shelter Kitchen",
            "claimed_at": datetime.utcnow() - timedelta(hours=28),
            "collected_at": datetime.utcnow() - timedelta(hours=26),
            "verification": "Collected on time. Signed receipt logged in mess register.",
        },
        {
            "title": "Vegetable Pulao & Raita",
            "category": "Grains",
            "qty": 12.0,
            "servings": 30,
            "prep_time": f"{today.isoformat()} 14:00",
            "deadline": f"{today.isoformat()} 18:00",
            "allergens": "Contains Dairy",
            "dietary": "Vegetarian",
            "storage": "Covered stainless steel container",
            "review": "pending_review",
            "staff": None,
            "status": "pending_review",
            "recip_name": None,
            "recip_contact": None,
            "recip_org": None,
            "claimed_at": None,
            "collected_at": None,
            "verification": "Awaiting staff temperature check and sensory inspection.",
        },
    ]

    for s in surplus_samples:
        db.add(
            SurplusListing(
                title=s["title"],
                food_category=s["category"],
                quantity_kg=s["qty"],
                servings_estimate=s["servings"],
                prepared_time=s["prep_time"],
                collection_deadline=s["deadline"],
                allergens=s["allergens"],
                dietary_info=s["dietary"],
                storage_condition=s["storage"],
                review_status=s["review"],
                approval_staff_name=s["staff"],
                status=s["status"],
                recipient_name=s["recip_name"],
                recipient_contact=s["recip_contact"],
                recipient_organization=s["recip_org"],
                claimed_at=s["claimed_at"],
                collected_at=s["collected_at"],
                verification_notes=s["verification"],
                is_demo_workflow=True,
            )
        )

    # 4. Seed a sample prediction with override for history
    db.add(
        PredictionLog(
            dish_name="Chicken Curry",
            category="Meat",
            planned_meals=320,
            kitchen_staff=12,
            temperature_c=26.0,
            humidity_pct=60.0,
            day_of_week=3,
            special_event=0,
            past_waste_kg=22.5,
            staff_experience="Intermediate",
            predicted_waste_kg=38.4,
            recommended_prep_kg=96.0,
            safety_buffer_kg=5.6,
            recommendation_reason="Staged batch cooking recommended (65% batch 1, 35% batch 2).",
            manager_override=True,
            override_prep_kg=102.0,
            override_reason="Higher evening exam week attendance expected from hostel blocks B & C.",
        )
    )

    db.commit()
    return {"status": "Successfully seeded initial mess kitchen records", "records_seeded": len(sample_meals)}
