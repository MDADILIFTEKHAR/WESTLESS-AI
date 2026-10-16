import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Filter,
  X,
} from 'lucide-react';
import { fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api';
import type { InventoryItem } from '../types';

interface InventoryViewProps {
  onSuccessToast?: (msg: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onSuccessToast }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState('Grains');
  const [formQty, setFormQty] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formBatch, setFormBatch] = useState('');
  const [formRec, setFormRec] = useState(new Date().toISOString().split('T')[0]);
  const [formExp, setFormExp] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formMin, setFormMin] = useState<number>(15);
  const [formLoc, setFormLoc] = useState('Dry Pantry');
  const [formCost, setFormCost] = useState<number>(2.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInventory(statusFilter);
      setItems(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formQty === '' || !formBatch.trim()) return;

    setIsSubmitting(true);
    try {
      await createInventoryItem({
        ingredient_name: formName,
        category: formCat,
        current_qty: Number(formQty),
        unit: formUnit,
        batch_number: formBatch,
        received_date: formRec,
        expiry_date: formExp,
        min_threshold_qty: Number(formMin),
        storage_location: formLoc,
        cost_per_unit: Number(formCost),
      });

      setIsModalOpen(false);
      resetForm();
      if (onSuccessToast) onSuccessToast('Inventory batch added successfully.');
      loadInventory();
    } catch (err: any) {
      alert(`Error adding item: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (id: number, current: number, delta: number) => {
    const newQty = Math.max(0, current + delta);
    try {
      await updateInventoryItem(id, { current_qty: newQty });
      loadInventory();
      if (onSuccessToast) onSuccessToast(`Stock updated to ${newQty} kg.`);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this inventory batch record?')) return;
    try {
      await deleteInventoryItem(id);
      setItems(items.filter((i) => i.id !== id));
      if (onSuccessToast) onSuccessToast('Inventory batch removed.');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormQty('');
    setFormBatch('');
  };

  const expiringCount = items.filter((i) => i.alert_status === 'Expiring Soon').length;
  const expiredCount = items.filter((i) => i.alert_status === 'Expired').length;
  const lowStockCount = items.filter((i) => i.alert_status === 'Low Stock').length;

  return (
    <div className="space-y-6">
      {/* Overview Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-charcoal-200 card-shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-charcoal-500 font-medium">Total Batches</span>
            <div className="text-xl font-bold text-charcoal-900 mt-0.5">{items.length}</div>
          </div>
          <Boxes className="w-6 h-6 text-charcoal-400" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-charcoal-200 card-shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-700 font-medium">Expiring Soon (≤ 72h)</span>
            <div className="text-xl font-bold text-amber-900 mt-0.5">{expiringCount}</div>
          </div>
          <Clock className="w-6 h-6 text-amber-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-charcoal-200 card-shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-700 font-medium">Past Expiry</span>
            <div className="text-xl font-bold text-rose-900 mt-0.5">{expiredCount}</div>
          </div>
          <XCircle className="w-6 h-6 text-rose-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-charcoal-200 card-shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-700 font-medium">Low Stock (&lt; Threshold)</span>
            <div className="text-xl font-bold text-blue-900 mt-0.5">{lowStockCount}</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-forest-600" />
          <span className="text-xs font-semibold text-charcoal-700">Filter Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {['All', 'Expiring Soon', 'Expired', 'Low Stock', 'Safe'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-forest-600 text-white'
                    : 'bg-warm-50 hover:bg-charcoal-100 text-charcoal-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ingredient Batch</span>
        </button>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 card-shadow overflow-hidden">
        <div className="p-4 border-b border-charcoal-100">
          <h3 className="font-bold text-charcoal-900 text-sm">Tracked Stock Batches</h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Deterministic rule-based shelf-life monitoring. Safe storage prioritizes ingredients near expiration.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-500">Loading inventory...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400">
            No items matching criteria. Click "Add Ingredient Batch" to log stock.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-warm-50/70 border-b border-charcoal-200 text-charcoal-600 font-semibold">
                  <th className="py-3 px-4">Ingredient & Batch</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4">Storage Bay</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Countdown</th>
                  <th className="py-3 px-4 text-center">Alert Status</th>
                  <th className="py-3 px-4 text-center">Quick Adjust</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {items.map((item) => {
                  let badgeClass = 'bg-forest-100 text-forest-800 border-forest-200';
                  if (item.alert_status === 'Expired') {
                    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                  } else if (item.alert_status === 'Expiring Soon') {
                    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                  } else if (item.alert_status === 'Low Stock') {
                    badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-warm-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-charcoal-900 block">
                          {item.ingredient_name}
                        </span>
                        <span className="text-[10px] text-charcoal-400 font-mono">
                          {item.batch_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">{item.category}</td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">
                        {item.current_qty} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {item.storage_location || 'Standard Pantry'}
                      </td>
                      <td className="py-3 px-4 text-charcoal-700">{item.expiry_date}</td>
                      <td className="py-3 px-4 text-center font-medium">
                        {item.days_to_expiry < 0 ? (
                          <span className="text-rose-700 font-bold">
                            {Math.abs(item.days_to_expiry)}d overdue
                          </span>
                        ) : item.days_to_expiry === 0 ? (
                          <span className="text-amber-700 font-bold">Expires Today</span>
                        ) : (
                          <span className="text-charcoal-700">{item.days_to_expiry} days</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}
                        >
                          {item.alert_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleAdjustStock(item.id, item.current_qty, -5)}
                            disabled={item.current_qty <= 0}
                            className="px-1.5 py-0.5 bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 rounded text-[10px] font-bold disabled:opacity-30"
                            title="Used 5 kg in preparation"
                          >
                            -5 kg
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item.id, item.current_qty, +10)}
                            className="px-1.5 py-0.5 bg-forest-100 hover:bg-forest-200 text-forest-800 rounded text-[10px] font-bold"
                            title="Added 10 kg new batch"
                          >
                            +10 kg
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-rose-50 text-charcoal-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-charcoal-200 card-shadow max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-forest-600" />
                <h3 className="font-bold text-charcoal-900 text-base">Register Ingredient Batch</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-charcoal-400 hover:text-charcoal-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Ingredient Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Paneer"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Category</label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs bg-white"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Grains">Grains</option>
                    <option value="Dry Goods">Dry Goods</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Current Qty</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="40"
                    value={formQty}
                    onChange={(e) => setFormQty(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Batch Code</label>
                  <input
                    type="text"
                    placeholder="BAT-2026-X"
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Received Date</label>
                  <input
                    type="date"
                    value={formRec}
                    onChange={(e) => setFormRec(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Use-By / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formExp}
                    onChange={(e) => setFormExp(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={formLoc}
                    onChange={(e) => setFormLoc(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Min Stock Threshold ({formUnit})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formMin}
                    onChange={(e) => setFormMin(parseFloat(e.target.value) || 15)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-charcoal-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-charcoal-600 hover:bg-charcoal-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-lg text-xs shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
