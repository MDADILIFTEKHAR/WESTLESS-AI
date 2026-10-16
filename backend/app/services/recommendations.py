from typing import Dict, Any, List


def generate_kitchen_recommendations(
    dish_name: str,
    waste_category: str,
    planned_meals: int,
    portion_size_kg: float,
    predicted_waste_kg: float,
    past_waste_kg: float,
    safety_buffer_pct: float = 0.05,
    kitchen_staff: int = 12,
    special_event: int = 0,
) -> Dict[str, Any]:
    """
    Transparent recommendation logic balancing waste prevention with operational shortage prevention.
    """
    # Baseline expected gross food consumption in kg
    baseline_demand_kg = round(planned_meals * portion_size_kg, 2)

    # Operational safety buffer in kg (preventing meal shortage is mandatory)
    safety_buffer_kg = round(baseline_demand_kg * max(0.04, safety_buffer_pct), 2)

    # Conservative batch deduction: adjust prep by at most 70% of predicted unconsumed surplus,
    # ensuring diners are never short-changed.
    waste_adjustment_factor = 0.65
    recommended_reduction_kg = round(predicted_waste_kg * waste_adjustment_factor, 2)

    # Recommended gross preparation quantity
    raw_prep_kg = baseline_demand_kg - recommended_reduction_kg + safety_buffer_kg
    # Never recommend preparing less than 85% of baseline demand
    min_safe_prep_kg = round(baseline_demand_kg * 0.85, 2)
    recommended_prep_kg = round(max(min_safe_prep_kg, raw_prep_kg), 2)

    actionable_tips: List[str] = []
    reasons: List[str] = []

    # 1. Staged cooking batch recommendation
    if planned_meals >= 200:
        batch1_pct = 65
        batch2_pct = 35
        batch1_kg = round(recommended_prep_kg * (batch1_pct / 100.0), 1)
        batch2_kg = round(recommended_prep_kg * (batch2_pct / 100.0), 1)
        actionable_tips.append(
            f"Stage preparation: Cook {batch1_kg} kg ({batch1_pct}%) initially. Prepare remaining {batch2_kg} kg ({batch2_pct}%) only if diner check-in reaches 60% by midpoint."
        )
        reasons.append(
            f"High volume service ({planned_meals} meals) poses overproduction risk if turnout lags."
        )
    else:
        actionable_tips.append(
            f"Cook full batch of {recommended_prep_kg} kg. Maintain continuous steam table temperature at >65°C."
        )

    # 2. Historical waste anomaly advice
    if past_waste_kg > 30.0:
        actionable_tips.append(
            f"Historical leftover for {dish_name} is high ({past_waste_kg} kg avg). Review standard ladle size (target: {portion_size_kg * 1000:.0f}g) to curb plate waste."
        )
        reasons.append(
            f"Historical waste benchmark ({past_waste_kg} kg) exceeds acceptable operational threshold of 25 kg."
        )

    # 3. Category-specific preparation guidance
    cat_lower = waste_category.lower()
    if cat_lower == "meat":
        actionable_tips.append(
            "High-value ingredient: Keep second batch marinated and refrigerated rather than pre-cooked."
        )
    elif cat_lower == "dairy":
        actionable_tips.append(
            "Perishable dairy base: Avoid leaving at ambient room temperature; chill remaining portion within 90 minutes."
        )
    elif cat_lower == "vegetables":
        actionable_tips.append(
            "Quick prep: Fresh vegetables can be flash-steamed in smaller 15-minute replenishment cycles."
        )

    # 4. Special event or weather note
    if special_event == 1:
        actionable_tips.append(
            "Special event in progress: Monitor diner flow carefully as dessert and side dish consumption shifts."
        )

    explanation = (
        f"Baseline demand for {planned_meals} meals is {baseline_demand_kg} kg. "
        f"Model predicts {predicted_waste_kg} kg surplus. "
        f"Applying conservative {waste_adjustment_factor * 100:.0f}% dampening with a +{safety_buffer_kg} kg "
        f"({safety_buffer_pct * 100:.0f}%) safety reserve yields a recommended preparation of {recommended_prep_kg} kg."
    )

    return {
        "baseline_demand_kg": baseline_demand_kg,
        "predicted_waste_kg": predicted_waste_kg,
        "recommended_prep_kg": recommended_prep_kg,
        "safety_buffer_kg": safety_buffer_kg,
        "recommendation_reason": explanation,
        "actionable_tips": actionable_tips,
        "reasons": reasons,
    }
