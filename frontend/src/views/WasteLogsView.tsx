import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { fetchWasteLogs, createWasteLog, deleteWasteLog } from '../services/api';
import type { WasteLog } from '../types';

interface WasteLogsViewProps {
  onSuccessToast?: (msg: string) => void;
}

export const WasteLogsView: React.FC<WasteLogsViewProps> = ({ onSuccessToast }) => {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [mealTypeFilter, setMealTypeFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMeal, setFormMeal] = useState('Lunch');
  const [formItem, setFormItem] = useState('');
  const [formCat, setFormCat] = useState('Grains');
  const [formPrep, setFormPrep] = useState<number | ''>('');
  const [formServ, setFormServ] = useState<number | ''>('');
  const [formLeft, setFormLeft] = useState<number | ''>('');
  const [formType, setFormType] = useState('Edible Surplus');
  const [formReason, setFormReason] = useState('Overpreparation');
  const [formCost, setFormCost] = useState<number>(2.5);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWasteLogs(categoryFilter, mealTypeFilter);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load waste logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [categoryFilter, mealTypeFilter]);

  // Auto-calculate leftover when prep and serv change
  useEffect(() => {
    if (formPrep !== '' && formServ !== '') {
      const diff = Math.max(0, Number(formPrep) - Number(formServ));
      setFormLeft(Number(diff.toFixed(2)));
    }
  }, [formPrep, formServ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItem.trim() || formPrep === '' || formServ === '') return;

    setIsSubmitting(true);
    try {
      await createWasteLog({
        date: formDate,
        meal_type: formMeal,
        food_item: formItem,
        waste_category: formCat,
        prepared_kg: Number(formPrep),
        served_kg: Number(formServ),
        leftover_kg: formLeft !== '' ? Number(formLeft) : undefined,
        waste_type: formType,
        waste_reason: formReason,
        cost_per_kg: Number(formCost),
        notes: formNotes || undefined,
      });

      setIsModalOpen(false);
      resetForm();
      if (onSuccessToast) onSuccessToast('Food waste log successfully recorded.');
      loadLogs();
    } catch (err: any) {
      alert(`Error saving log: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recorded log?')) return;
    try {
      await deleteWasteLog(id);
      setLogs(logs.filter((l) => l.id !== id));
      if (onSuccessToast) onSuccessToast('Log record deleted.');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormItem('');
    setFormPrep('');
    setFormServ('');
    setFormLeft('');
    setFormNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-charcoal-700">
            <Filter className="w-3.5 h-3.5 text-forest-600" />
            <span>Filter By:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-charcoal-200 text-xs bg-warm-50 text-charcoal-800 focus:outline-hidden focus:ring-1 focus:ring-forest-500"
          >
            <option value="All">All Categories</option>
            <option value="Meat">Meat</option>
            <option value="Dairy">Dairy</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Grains">Grains</option>
          </select>

          <select
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-charcoal-200 text-xs bg-warm-50 text-charcoal-800 focus:outline-hidden focus:ring-1 focus:ring-forest-500"
          >
            <option value="All">All Meal Types</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
        </div>

        {/* Record New Log Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Meal Leftovers</span>
        </button>
      </div>

      {/* Waste Logs Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 card-shadow overflow-hidden">
        <div className="p-4 border-b border-charcoal-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-charcoal-900 text-sm">Measured Service Logs</h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Verified physical kitchen scale measurements ({logs.length} records)
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-500">Loading records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400">
            No waste logs found matching criteria. Click "Record Meal Leftovers" to add a log.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-warm-50/70 border-b border-charcoal-200 text-charcoal-600 font-semibold">
                  <th className="py-3 px-4">Date & Meal</th>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Prepared</th>
                  <th className="py-3 px-4 text-right">Served</th>
                  <th className="py-3 px-4 text-right">Leftover</th>
                  <th className="py-3 px-4 text-center">Waste %</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {logs.map((log) => {
                  const wastePct =
                    log.prepared_kg > 0
                      ? ((log.leftover_kg / log.prepared_kg) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={log.id} className="hover:bg-warm-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-charcoal-900 block">{log.date}</span>
                        <span className="text-[10px] text-charcoal-500">{log.meal_type}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-charcoal-800">{log.food_item}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-charcoal-100 text-charcoal-700">
                          {log.waste_category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-charcoal-800">
                        {log.prepared_kg} kg
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-charcoal-800">
                        {log.served_kg} kg
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {log.leftover_kg} kg
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {wastePct}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.waste_type === 'Edible Surplus'
                              ? 'bg-forest-100 text-forest-800'
                              : log.waste_type === 'Plate Waste'
                              ? 'bg-charcoal-100 text-charcoal-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.waste_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">{log.waste_reason || '—'}</td>
                      <td className="py-3 px-4 text-right font-medium text-charcoal-700">
                        ${(log.leftover_kg * log.cost_per_kg).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1 hover:bg-rose-50 text-charcoal-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Record"
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

      {/* Create Log Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-charcoal-200 card-shadow max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-forest-600" />
                <h3 className="font-bold text-charcoal-900 text-base">Record Meal Waste Scale Data</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-charcoal-400 hover:text-charcoal-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Service Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Meal Period</label>
                  <select
                    value={formMeal}
                    onChange={(e) => setFormMeal(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs bg-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Dish / Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chicken Biryani"
                    value={formItem}
                    onChange={(e) => setFormItem(e.target.value)}
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
                    <option value="Grains">Grains</option>
                    <option value="Meat">Meat</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Vegetables">Vegetables</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Prepared (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    placeholder="120"
                    value={formPrep}
                    onChange={(e) => setFormPrep(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Served (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="105"
                    value={formServ}
                    onChange={(e) => setFormServ(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Leftover (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Auto: 15"
                    value={formLeft}
                    onChange={(e) => setFormLeft(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs bg-warm-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Waste Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs bg-white"
                  >
                    <option value="Edible Surplus">Edible Surplus (Rescuable)</option>
                    <option value="Plate Waste">Plate Waste (Discarded)</option>
                    <option value="Prep Spoilage">Prep Spoilage / Trimmings</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Primary Reason</label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs bg-white"
                  >
                    <option value="Overpreparation">Overpreparation</option>
                    <option value="Low Attendance">Low Diner Turnout</option>
                    <option value="Portion Sizing">Portion Sizing Excess</option>
                    <option value="Taste/Recipe">Taste / Unpopular Recipe</option>
                    <option value="Quality Issue">Quality / Sensory Issue</option>
                    <option value="Weather Impact">Sudden Weather Impact</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Ingredient Cost ($ / kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formCost}
                  onChange={(e) => setFormCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Exam week evening service; extra rice prepared"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                />
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
                  {isSubmitting ? 'Recording...' : 'Save Log Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
