import React from 'react';
import {
  TrendingDown,
  Scale,
  Utensils,
  DollarSign,
  HeartHandshake,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ClipboardList,
  ShieldAlert,
  Boxes,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardSummary, InsightsData } from '../types';

interface OverviewViewProps {
  summary: DashboardSummary | null;
  insights: InsightsData | null;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  summary,
  insights,
  setActiveTab,
  isLoading,
}) => {
  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div>
          <p className="text-sm text-charcoal-500 font-medium">Loading live kitchen telemetry...</p>
        </div>
      </div>
    );
  }

  const hasExpiring = summary.expiring_soon_items_count > 0 || summary.expired_items_count > 0;
  const trendData = insights?.daily_trend?.slice(-10) || [];

  return (
    <div className="space-y-6">
      {/* 1. Critical Operational Alert Banner */}
      {hasExpiring && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                Action Required: Shelf-Life Expiry Warnings
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {summary.expiring_soon_items_count} ingredient batch(es) expiring within 72 hours,{' '}
                and {summary.expired_items_count} batch(es) past use-by date.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <span>Review Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Primary KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Food Prepared */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Food Prepared
            </span>
            <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center text-forest-700">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-charcoal-900">
              {summary.total_prepared_kg.toLocaleString()} <span className="text-sm font-normal text-charcoal-500">kg</span>
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              Served: <strong className="text-charcoal-700">{summary.total_served_kg.toLocaleString()} kg</strong>
            </p>
          </div>
        </div>

        {/* Measured Waste Rate */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Measured Waste Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-charcoal-900">
              {summary.waste_rate_percent}%
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              Leftover: <strong className="text-charcoal-700">{summary.total_leftover_kg} kg</strong>
            </p>
          </div>
        </div>

        {/* Cost of Unconsumed Food */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Recorded Waste Cost
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-charcoal-900">
              ${summary.total_food_cost_wasted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              Across recorded mess service logs
            </p>
          </div>
        </div>

        {/* Surplus Rescued */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Surplus Rescued
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-charcoal-900">
              {summary.rescued_surplus_kg} <span className="text-sm font-normal text-charcoal-500">kg</span>
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              {summary.rescue_conversion_rate}% of edible surplus rescued
            </p>
          </div>
        </div>
      </div>

      {/* 3. Daily Waste & Preparation Trend Chart */}
      <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-charcoal-100 gap-2">
          <div>
            <h3 className="font-bold text-charcoal-900 text-base">Daily Food Production & Waste History</h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Verified daily scale logs comparing mass prepared, served, and unconsumed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('waste-logs')}
              className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1"
            >
              <span>View Detailed Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full pt-4">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="prepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="leftGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="kg" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="prepared_kg"
                  name="Prepared (kg)"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#prepGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="served_kg"
                  name="Served (kg)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="none"
                />
                <Area
                  type="monotone"
                  dataKey="leftover_kg"
                  name="Leftovers (kg)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#leftGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-charcoal-400 text-xs">
              No trend data available yet. Record meal logs to display history.
            </div>
          )}
        </div>
      </div>

      {/* 4. Quick Operational Workflow Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('prediction')}
          className="bg-forest-50/70 border border-forest-200 p-5 rounded-xl cursor-pointer hover:bg-forest-100/60 transition-all flex items-start space-x-3.5 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-forest-950 flex items-center gap-1">
              AI Waste Prediction
              <ArrowRight className="w-3.5 h-3.5 text-forest-600 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-xs text-forest-800 mt-1 leading-relaxed">
              Enter expected meal count to forecast likely unconsumed food and receive staged batch recommendations.
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('waste-logs')}
          className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-xl cursor-pointer hover:bg-emerald-100/50 transition-all flex items-start space-x-3.5 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1">
              Log Kitchen Service
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Record closing meal quantities (prepared vs served vs unconsumed) and categorize reasons.
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('surplus')}
          className="bg-blue-50/60 border border-blue-200 p-5 rounded-xl cursor-pointer hover:bg-blue-100/50 transition-all flex items-start space-x-3.5 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-blue-950 flex items-center gap-1">
              Surplus Recovery
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 transition-transform group-hover:translate-x-1" />
            </h4>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              Publish inspected edible surplus for verified local charity collection with audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Honest Data Provenance Section */}
      <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow">
        <h4 className="text-xs font-bold text-charcoal-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-forest-700" />
          Data Provenance & Verification Standards
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-100">
            <span className="font-bold text-charcoal-800 block">Waste Records</span>
            <p className="text-charcoal-600 mt-0.5 leading-snug">
              {summary.provenance?.waste_measurements || 'Actual scale measurements recorded in local SQLite database.'}
            </p>
          </div>
          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-100">
            <span className="font-bold text-charcoal-800 block">ML Model Provenance</span>
            <p className="text-charcoal-600 mt-0.5 leading-snug">
              {summary.provenance?.prediction_model || 'Trained scikit-learn regression pipeline evaluated on held-out split.'}
            </p>
          </div>
          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-100">
            <span className="font-bold text-charcoal-800 block">Inventory Rules</span>
            <p className="text-charcoal-600 mt-0.5 leading-snug">
              {summary.provenance?.inventory_alerts || 'Deterministic shelf-life countdown (Expiring soon <= 3 days).'}
            </p>
          </div>
          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-100">
            <span className="font-bold text-charcoal-800 block">Donations Workflow</span>
            <p className="text-charcoal-600 mt-0.5 leading-snug">
              {summary.provenance?.surplus_rescue || 'Local demonstration workflow simulating NGO collection chain.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
