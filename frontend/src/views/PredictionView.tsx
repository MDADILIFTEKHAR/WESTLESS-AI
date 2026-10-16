import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  ChefHat,
  Thermometer,
  Users,
  CheckCircle2,
  FileEdit,
  History,
  TrendingDown,
  Info,
} from 'lucide-react';
import { predictWaste, submitOverride, fetchPredictionHistory } from '../services/api';
import type { PredictionResult } from '../types';

interface PredictionViewProps {
  onSuccessToast?: (msg: string) => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({ onSuccessToast }) => {
  // Scenario Form State
  const [dishName, setDishName] = useState('Chicken Curry');
  const [category, setCategory] = useState('Meat');
  const [plannedMeals, setPlannedMeals] = useState<number>(320);
  const [kitchenStaff, setKitchenStaff] = useState<number>(12);
  const [temperature, setTemperature] = useState<number>(25.0);
  const [humidity, setHumidity] = useState<number>(55.0);
  const [dayOfWeek, setDayOfWeek] = useState<number>(2); // Wednesday
  const [specialEvent, setSpecialEvent] = useState<number>(0);
  const [pastWaste, setPastWaste] = useState<number>(22.0);
  const [staffExperience, setStaffExperience] = useState('Intermediate');
  const [portionSize, setPortionSize] = useState<number>(0.35);
  const [safetyBufferPct, setSafetyBufferPct] = useState<number>(0.05);

  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manager Override State
  const [overridePrepKg, setOverridePrepKg] = useState<number | ''>('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    try {
      const data = await fetchPredictionHistory();
      setHistory(data);
    } catch (e) {
      console.error('Error fetching prediction history:', e);
    }
  };

  React.useEffect(() => {
    loadHistory();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOverrideSuccess(false);

    try {
      const payload = {
        dish_name: dishName,
        planned_meals: plannedMeals,
        kitchen_staff: kitchenStaff,
        temperature_C: temperature,
        humidity_percent: humidity,
        day_of_week: dayOfWeek,
        special_event: specialEvent,
        past_waste_kg: pastWaste,
        staff_experience: staffExperience,
        waste_category: category,
        portion_size_kg: portionSize,
        safety_buffer_pct: safetyBufferPct,
      };
      const result = await predictWaste(payload);
      setPrediction(result);
      setOverridePrepKg(result.recommended_prep_kg);
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prediction || overridePrepKg === '' || !overrideReason.trim()) return;

    setIsSubmittingOverride(true);
    try {
      await submitOverride({
        dish_name: prediction.dish_name,
        category: category,
        planned_meals: prediction.planned_meals,
        kitchen_staff: kitchenStaff,
        temperature_c: temperature,
        humidity_pct: humidity,
        day_of_week: dayOfWeek,
        special_event: specialEvent,
        past_waste_kg: pastWaste,
        staff_experience: staffExperience,
        predicted_waste_kg: prediction.predicted_waste_kg,
        recommended_prep_kg: prediction.recommended_prep_kg,
        safety_buffer_kg: prediction.safety_buffer_kg,
        recommendation_reason: prediction.recommendation_reason,
        override_prep_kg: Number(overridePrepKg),
        override_reason: overrideReason,
      });
      setOverrideSuccess(true);
      loadHistory();
      if (onSuccessToast) onSuccessToast('Manager preparation override logged with audit trail.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit override');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Leakage Prevention & Methodology Notice */}
      <div className="bg-forest-50/60 border border-forest-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-forest-900 shadow-xs">
        <Info className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-forest-950">Pre-Meal Operational Guarantee:</strong>{' '}
          Input feature <em>Planned Meals</em> uses pre-meal diner bookings rather than post-service meals served,
          preventing temporal data leakage. Predictions include a mandatory safety buffer to eliminate diner shortage risk.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
          <div className="flex items-center space-x-2 pb-4 border-b border-charcoal-100">
            <ChefHat className="w-5 h-5 text-forest-600" />
            <h3 className="font-bold text-charcoal-900 text-base">Meal & Kitchen Scenario</h3>
          </div>

          <form onSubmit={handlePredict} className="mt-5 space-y-4 text-xs">
            {/* Dish Name & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Food Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm bg-white"
                >
                  <option value="Meat">Meat</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Grains">Grains</option>
                </select>
              </div>
            </div>

            {/* Planned Meals & Kitchen Staff */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Planned Diners (Meals)
                </label>
                <input
                  type="number"
                  min="20"
                  max="5000"
                  value={plannedMeals}
                  onChange={(e) => setPlannedMeals(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                  required
                />
                <span className="text-[10px] text-charcoal-400">Hostel booked count</span>
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Kitchen Staff</label>
                <input
                  type="number"
                  min="2"
                  max="40"
                  value={kitchenStaff}
                  onChange={(e) => setKitchenStaff(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                  required
                />
                <span className="text-[10px] text-charcoal-400">Staff members on shift</span>
              </div>
            </div>

            {/* Ambient Conditions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Humidity (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                />
              </div>
            </div>

            {/* Day of Week & Special Event */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm bg-white"
                >
                  <option value={0}>Monday</option>
                  <option value={1}>Tuesday</option>
                  <option value={2}>Wednesday</option>
                  <option value={3}>Thursday</option>
                  <option value={4}>Friday</option>
                  <option value={5}>Saturday</option>
                  <option value={6}>Sunday</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Service Type</label>
                <select
                  value={specialEvent}
                  onChange={(e) => setSpecialEvent(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm bg-white"
                >
                  <option value={0}>Regular Dining Service</option>
                  <option value={1}>Special Feast / Hostel Event</option>
                </select>
              </div>
            </div>

            {/* Historical Benchmark & Staff Experience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Past Waste Benchmark (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={pastWaste}
                  onChange={(e) => setPastWaste(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                />
                <span className="text-[10px] text-charcoal-400">Previous measured leftovers</span>
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Cook Experience</label>
                <select
                  value={staffExperience}
                  onChange={(e) => setStaffExperience(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Portion & Safety Buffer */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-charcoal-100">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Portion (kg/meal)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.5"
                  value={portionSize}
                  onChange={(e) => setPortionSize(parseFloat(e.target.value) || 0.35)}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Safety Buffer</label>
                <select
                  value={safetyBufferPct}
                  onChange={(e) => setSafetyBufferPct(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm bg-white"
                >
                  <option value={0.04}>4% (Strict)</option>
                  <option value={0.05}>5% (Recommended Standard)</option>
                  <option value={0.08}>8% (Conservative Buffer)</option>
                  <option value={0.10}>10% (High Volatility Reserve)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center space-x-2 py-2.5 px-4 bg-forest-600 hover:bg-forest-700 active:scale-98 text-white font-semibold rounded-lg transition-all shadow-xs disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running Scikit-Learn Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Waste & Adjust Preparation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Prediction & Recommendations Result */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Prediction Error:</strong> {error}
              </div>
            </div>
          )}

          {prediction ? (
            <div className="space-y-6">
              {/* Output Scorecard Card */}
              <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
                <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest-500"></span>
                    <h3 className="font-bold text-charcoal-900 text-base">Model Prediction Output</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      prediction.is_demo_fallback
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-forest-100 text-forest-800'
                    }`}
                  >
                    {prediction.is_demo_fallback ? 'Demo Fallback' : `${prediction.model_name} v${prediction.model_version}`}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Predicted Waste */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      Expected Unconsumed Food
                    </span>
                    <div className="mt-1 flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-amber-950">
                        {prediction.predicted_waste_kg}
                      </span>
                      <span className="text-sm font-semibold text-amber-800">kg</span>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1">
                      90% Interval: [{prediction.confidence_range_kg[0]} — {prediction.confidence_range_kg[1]} kg]
                    </p>
                  </div>

                  {/* Recommended Prep */}
                  <div className="p-4 rounded-xl bg-forest-50 border border-forest-200">
                    <span className="text-xs font-semibold text-forest-800 uppercase tracking-wider">
                      Recommended Preparation
                    </span>
                    <div className="mt-1 flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-forest-950">
                        {prediction.recommended_prep_kg}
                      </span>
                      <span className="text-sm font-semibold text-forest-800">kg</span>
                    </div>
                    <p className="text-[11px] text-forest-700 mt-1">
                      Includes +{prediction.safety_buffer_kg} kg safety reserve buffer
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-4 p-3.5 bg-warm-50 rounded-lg border border-charcoal-200 text-xs text-charcoal-700 leading-relaxed">
                  <p className="font-semibold text-charcoal-900 mb-0.5">Model Reasoning:</p>
                  {prediction.recommendation_reason}
                </div>

                {/* Actionable Tips */}
                {prediction.actionable_tips.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                      Recommended Batch Schedule & Safety Controls
                    </h4>
                    <div className="space-y-1.5">
                      {prediction.actionable_tips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2 text-xs text-charcoal-700 p-2.5 rounded-lg bg-white border border-charcoal-150"
                        >
                          <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Manager Preparation Override Card */}
              <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
                <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
                  <div className="flex items-center space-x-2">
                    <FileEdit className="w-4 h-4 text-charcoal-700" />
                    <h3 className="font-bold text-charcoal-900 text-sm">
                      Kitchen Manager Decision & Override
                    </h3>
                  </div>
                  <span className="text-[11px] text-charcoal-500">Audited in SQLite</span>
                </div>

                {overrideSuccess ? (
                  <div className="mt-4 p-4 bg-forest-50 border border-forest-200 rounded-lg text-forest-900 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
                    <div>
                      <strong>Override Successfully Logged!</strong> Preparation quantity of{' '}
                      <strong>{overridePrepKg} kg</strong> has been recorded in the permanent audit trail.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleOverrideSubmit} className="mt-4 space-y-3 text-xs">
                    <p className="text-charcoal-600">
                      If floor conditions differ from model assumptions (e.g. unexpected guest influx or rainy weather),
                      record your operational override with justification.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-charcoal-700 mb-1">
                          Final Target Prep (kg)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={overridePrepKg}
                          onChange={(e) => setOverridePrepKg(parseFloat(e.target.value) || '')}
                          className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-charcoal-700 mb-1">
                          Manager Justification / Reason
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Higher exam week attendance from Hostel Block C"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 text-sm"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingOverride || !overrideReason.trim()}
                      className="px-4 py-2 bg-charcoal-800 hover:bg-charcoal-900 text-white font-semibold rounded-lg transition-colors text-xs disabled:opacity-50"
                    >
                      {isSubmittingOverride ? 'Saving Override...' : 'Log Operational Override'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] bg-white rounded-xl border border-charcoal-200 border-dashed p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-600 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-charcoal-900 text-base">Enter Meal Parameters</h4>
              <p className="text-xs text-charcoal-500 max-w-sm mt-1 leading-relaxed">
                Fill in the kitchen scenario on the left and run the prediction to view expected food waste,
                safe preparation target, and staged cooking instructions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prediction & Manager Override History Audit Table */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-charcoal-200 card-shadow overflow-hidden">
          <div className="p-4 border-b border-charcoal-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-forest-600" />
              <h4 className="font-bold text-charcoal-900 text-sm">
                Prediction & Manager Override Audit Trail
              </h4>
            </div>
            <span className="text-[11px] text-charcoal-500">
              Last {history.length} operations stored in SQLite
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-warm-50/70 border-b border-charcoal-200 text-charcoal-600 font-semibold">
                  <th className="py-2.5 px-4">Dish & Category</th>
                  <th className="py-2.5 px-4 text-right">Planned Diners</th>
                  <th className="py-2.5 px-4 text-right">Predicted Waste</th>
                  <th className="py-2.5 px-4 text-right">Model Target</th>
                  <th className="py-2.5 px-4">Decision Status</th>
                  <th className="py-2.5 px-4 text-right">Final Prep</th>
                  <th className="py-2.5 px-4">Manager Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-warm-50/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-charcoal-900 block">{h.dish_name}</span>
                      <span className="text-[10px] text-charcoal-500">{h.category}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-charcoal-800">
                      {h.planned_meals}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-700">
                      {h.predicted_waste_kg} kg
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-charcoal-700">
                      {h.recommended_prep_kg} kg
                    </td>
                    <td className="py-2.5 px-4">
                      {h.manager_override ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Manager Override
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-800 border border-forest-200">
                          Model Standard
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-charcoal-900">
                      {h.manager_override ? `${h.override_prep_kg} kg` : `${h.recommended_prep_kg} kg`}
                    </td>
                    <td className="py-2.5 px-4 text-charcoal-600 max-w-xs truncate">
                      {h.override_reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
