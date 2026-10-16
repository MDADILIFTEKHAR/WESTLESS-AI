export interface WasteLog {
  id: number;
  date: string;
  meal_type: string;
  food_item: string;
  waste_category: string;
  prepared_kg: number;
  served_kg: number;
  leftover_kg: number;
  waste_type: string;
  waste_reason?: string;
  cost_per_kg: number;
  notes?: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  ingredient_name: string;
  category: string;
  current_qty: number;
  unit: string;
  batch_number: string;
  received_date: string;
  expiry_date: string;
  min_threshold_qty: number;
  storage_location?: string;
  cost_per_unit: number;
  notes?: string;
  created_at: string;
  days_to_expiry: number;
  alert_status: 'Safe' | 'Expiring Soon' | 'Expired' | 'Low Stock';
}

export interface SurplusListing {
  id: number;
  title: string;
  food_category: string;
  quantity_kg: number;
  servings_estimate: number;
  prepared_time: string;
  collection_deadline: string;
  allergens?: string;
  dietary_info?: string;
  storage_condition?: string;
  review_status: 'pending_review' | 'approved' | 'rejected';
  approval_staff_name?: string;
  status: 'pending_review' | 'available' | 'claimed' | 'collected' | 'expired' | 'cancelled';
  recipient_name?: string;
  recipient_contact?: string;
  recipient_organization?: string;
  claimed_at?: string;
  collected_at?: string;
  verification_notes?: string;
  is_demo_workflow: boolean;
  created_at: string;
}

export interface PredictionResult {
  dish_name: string;
  planned_meals: number;
  predicted_waste_kg: number;
  confidence_range_kg: [number, number];
  uncertainty_margin_kg: number;
  model_version: string;
  model_name: string;
  is_demo_fallback: boolean;
  validation_rmse_kg?: number;
  recommended_prep_kg: number;
  safety_buffer_kg: number;
  recommendation_reason: string;
  actionable_tips: string[];
  operational_caveats: string[];
  created_at?: string;
}

export interface DashboardSummary {
  total_prepared_kg: number;
  total_served_kg: number;
  total_leftover_kg: number;
  waste_rate_percent: number;
  total_food_cost_wasted: number;
  edible_surplus_kg: number;
  rescued_surplus_kg: number;
  rescue_conversion_rate: number;
  expiring_soon_items_count: number;
  expired_items_count: number;
  low_stock_items_count: number;
  active_surplus_listings_count: number;
  records_count: number;
  model_status: {
    is_trained: boolean;
    model_name: string;
    version?: string;
    rmse_kg?: number;
    mae_kg?: number;
    r2?: number;
    validation?: string;
    train_samples?: number;
    test_samples?: number;
  };
  provenance: {
    waste_measurements: string;
    prediction_model: string;
    surplus_rescue: string;
    inventory_alerts: string;
  };
}

export interface InsightsData {
  category_summary: {
    category: string;
    prepared_kg: number;
    leftover_kg: number;
    cost_wasted: number;
    waste_rate: number;
    meals_count: number;
  }[];
  meal_summary: {
    meal_type: string;
    prepared_kg: number;
    leftover_kg: number;
    cost_wasted: number;
    waste_rate: number;
    meals_count: number;
  }[];
  daily_trend: {
    date: string;
    prepared_kg: number;
    served_kg: number;
    leftover_kg: number;
    cost_wasted: number;
    waste_rate: number;
  }[];
  reason_summary: {
    reason: string;
    leftover_kg: number;
  }[];
}
