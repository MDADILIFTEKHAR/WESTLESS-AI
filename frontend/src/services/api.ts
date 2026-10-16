import type {
  DashboardSummary,
  InsightsData,
  WasteLog,
  InventoryItem,
  SurplusListing,
  PredictionResult,
} from '../types';

const API_BASE = '/api';

export async function fetchSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error(`Failed to fetch dashboard summary: ${res.statusText}`);
  return res.json();
}

export async function fetchInsights(): Promise<InsightsData> {
  const res = await fetch(`${API_BASE}/dashboard/insights`);
  if (!res.ok) throw new Error(`Failed to fetch insights: ${res.statusText}`);
  return res.json();
}

export async function predictWaste(payload: any): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict-waste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function submitOverride(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/predict-waste/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to submit override');
  }
  return res.json();
}

export async function fetchPredictionHistory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/predict-waste/history`);
  if (!res.ok) throw new Error('Failed to fetch prediction history');
  return res.json();
}

export async function fetchWasteLogs(category?: string, mealType?: string): Promise<WasteLog[]> {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (mealType && mealType !== 'All') params.append('meal_type', mealType);

  const res = await fetch(`${API_BASE}/waste-logs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch waste logs');
  return res.json();
}

export async function createWasteLog(payload: Partial<WasteLog>): Promise<WasteLog> {
  const res = await fetch(`${API_BASE}/waste-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create waste log');
  }
  return res.json();
}

export async function deleteWasteLog(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/waste-logs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete waste log');
}

export async function fetchInventory(statusFilter?: string): Promise<InventoryItem[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'All') params.append('status_filter', statusFilter);

  const res = await fetch(`${API_BASE}/inventory?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}

export async function createInventoryItem(payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const res = await fetch(`${API_BASE}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create inventory item');
  }
  return res.json();
}

export async function updateInventoryItem(id: number, payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const res = await fetch(`${API_BASE}/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to update inventory item');
  }
  return res.json();
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete inventory item');
}

export async function fetchSurplusListings(statusFilter?: string): Promise<SurplusListing[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);

  const res = await fetch(`${API_BASE}/surplus-listings?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch surplus listings');
  return res.json();
}

export async function createSurplusListing(payload: Partial<SurplusListing>): Promise<SurplusListing> {
  const res = await fetch(`${API_BASE}/surplus-listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create surplus listing');
  }
  return res.json();
}

export async function updateSurplusStatus(id: number, payload: any): Promise<SurplusListing> {
  const res = await fetch(`${API_BASE}/surplus-listings/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to update surplus status');
  }
  return res.json();
}

export async function deleteSurplusListing(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/surplus-listings/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete surplus listing');
}

export async function fetchModelMetrics(): Promise<any> {
  const res = await fetch(`${API_BASE}/model/metrics`);
  if (!res.ok) throw new Error('Failed to fetch model metrics');
  return res.json();
}

export async function seedDemoData(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
  return res.json();
}

export async function resetDemoData(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  return res.json();
}
