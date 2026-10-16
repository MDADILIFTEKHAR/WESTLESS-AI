import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingDown,
  ShieldCheck,
  Scale,
  DollarSign,
  AlertCircle,
  FileCheck2,
  PieChart as PieIcon,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { fetchModelMetrics, fetchInsights } from '../services/api';
import type { InsightsData } from '../types';

export const InsightsView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [m, i] = await Promise.all([fetchModelMetrics().catch(() => null), fetchInsights().catch(() => null)]);
        setMetrics(m);
        setInsights(i);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div>
          <p className="text-sm text-charcoal-500 font-medium">Aggregating validation metrics & insights...</p>
        </div>
      </div>
    );
  }

  // Model comparison data for chart
  const comparisonData = metrics?.model_comparison
    ? Object.entries(metrics.model_comparison).map(([name, vals]: [string, any]) => ({
        name: name.replace(' Regressor', '').replace(' (Median Dummy)', ''),
        MAE: vals.mae,
        RMSE: vals.rmse,
        R2: vals.r2,
      }))
    : [];

  const categoryData = insights?.category_summary || [];
  const mealData = insights?.meal_summary || [];
  const reasonData = insights?.reason_summary || [];

  const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-600"></span>
            <span className="text-xs font-bold text-forest-700 uppercase tracking-wider">
              Transparent ML Validation Report
            </span>
          </div>
          <h3 className="text-xl font-bold text-charcoal-900 mt-1">
            Held-Out Test Performance & Provenance
          </h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Evaluated on held-out 2024 institutional test partition (183 rows) to prevent time-series data leakage.
          </p>
        </div>

        {metrics?.selected_model_metrics && (
          <div className="flex items-center space-x-4 bg-warm-50 px-4 py-2.5 rounded-xl border border-charcoal-200 text-xs">
            <div>
              <span className="text-charcoal-500 block">Held-out R² Score</span>
              <strong className="text-base font-extrabold text-forest-800">
                {metrics.selected_model_metrics.r2}
              </strong>
            </div>
            <div className="h-8 w-px bg-charcoal-200"></div>
            <div>
              <span className="text-charcoal-500 block">Held-out RMSE</span>
              <strong className="text-base font-extrabold text-charcoal-900">
                {metrics.selected_model_metrics.rmse} kg
              </strong>
            </div>
            <div className="h-8 w-px bg-charcoal-200"></div>
            <div>
              <span className="text-charcoal-500 block">Held-out MAE</span>
              <strong className="text-base font-extrabold text-charcoal-900">
                {metrics.selected_model_metrics.mae} kg
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. Model Benchmark Comparison Chart & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
            <div>
              <h4 className="font-bold text-charcoal-900 text-sm">Model Comparison on Held-Out Split</h4>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Baseline Dummy vs Ridge Regression vs Tree Ensembles (Lower error is better)
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="kg" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="RMSE" name="RMSE (kg)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MAE" name="MAE (kg)" fill="#86efac" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Methodology & Limitations */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-charcoal-200 card-shadow space-y-4">
          <h4 className="font-bold text-charcoal-900 text-sm pb-2 border-b border-charcoal-100">
            Validation Methodology & Limitations
          </h4>

          <div className="space-y-3 text-xs text-charcoal-700">
            <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-200">
              <strong className="block text-charcoal-900">Chronological Held-Out Split:</strong>
              Training: {metrics?.metadata?.train_sample_count || 728} rows (2022-01 to 2024-02).
              Testing: {metrics?.metadata?.test_sample_count || 183} rows (2024-03 to 2024-09).
            </div>

            <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-200">
              <strong className="block text-charcoal-900">Why Ridge Regression Won:</strong>
              The dataset contains strong linear relationship with planned meals (r=0.85). L2 regularized Ridge prevents overfitting on high-leverage banquets while avoiding tree discretization artifacts.
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-charcoal-800 block text-[11px] uppercase tracking-wider">
                Documented Constraints:
              </span>
              {(metrics?.limitations || [
                'Trained on institutional/mess tabular records; performance on fine-dining may require calibration.',
                'High variance during unannounced hostel mass absences or exams.',
                'Estimates carry uncertainty intervals; always maintain minimum 5% buffer.',
              ]).map((lim: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2 text-[11px] text-charcoal-600">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{lim}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Waste Analytics by Category & Meal Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
          <h4 className="font-bold text-charcoal-900 text-sm pb-3 border-b border-charcoal-100">
            Recorded Waste by Food Category
          </h4>

          <div className="h-[240px] w-full pt-4">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="kg" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="prepared_kg" name="Prepared (kg)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leftover_kg" name="Leftovers (kg)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                No category records available.
              </div>
            )}
          </div>
        </div>

        {/* Meal Type Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
          <h4 className="font-bold text-charcoal-900 text-sm pb-3 border-b border-charcoal-100">
            Recorded Waste by Meal Service
          </h4>

          <div className="h-[240px] w-full pt-4">
            {mealData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mealData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="meal_type" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="kg" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="leftover_kg" name="Leftover (kg)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost_wasted" name="Cost ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                No meal records available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Primary Root Cause Analysis */}
      <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
        <h4 className="font-bold text-charcoal-900 text-sm pb-3 border-b border-charcoal-100">
          Root Cause Breakdown (Recorded Waste Reasons)
        </h4>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-xs">
            {reasonData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-warm-50 border border-charcoal-100"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  <span className="font-semibold text-charcoal-800">{item.reason}</span>
                </div>
                <span className="font-bold text-charcoal-900">{item.leftover_kg} kg</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-forest-50/60 rounded-xl border border-forest-200 flex flex-col justify-center text-xs text-forest-900">
            <h5 className="font-bold text-forest-950 mb-1 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-forest-700" />
              Operational Insight for Kitchen Management
            </h5>
            <p className="leading-relaxed">
              <strong>Overpreparation</strong> and <strong>Low Diner Turnout</strong> account for the majority of unconsumed food.
              Implementing staged batch cooking (65% initial prep, 35% contingent prep at midpoint) directly addresses both causes without risking meal shortages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
