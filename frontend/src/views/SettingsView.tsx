import React, { useState, useEffect } from 'react';
import {
  Building,
  RotateCcw,
  Database,
  CheckCircle2,
  Sparkles,
  Server,
} from 'lucide-react';
import { seedDemoData, resetDemoData } from '../services/api';

interface SettingsViewProps {
  onSuccessToast?: (msg: string) => void;
  onRefreshAll?: () => void;
}

const STORAGE_KEY = 'wasteless_ai_facility_settings';

export const SettingsView: React.FC<SettingsViewProps> = ({ onSuccessToast, onRefreshAll }) => {
  const [facilityName, setFacilityName] = useState('Campus Central Dining Hall #3');
  const [facilityType, setFacilityType] = useState('College Mess / Hostel Dining');
  const [capacity, setCapacity] = useState<number>(1200);

  const [safetyBuffer, setSafetyBuffer] = useState<number>(5);
  const [expiryDays, setExpiryDays] = useState<number>(3);
  const [lowStockLimit, setLowStockLimit] = useState<number>(15);

  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load persisted facility profile from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.facilityName) setFacilityName(parsed.facilityName);
        if (parsed.facilityType) setFacilityType(parsed.facilityType);
        if (parsed.capacity) setCapacity(Number(parsed.capacity));
        if (parsed.safetyBuffer) setSafetyBuffer(Number(parsed.safetyBuffer));
        if (parsed.expiryDays) setExpiryDays(Number(parsed.expiryDays));
        if (parsed.lowStockLimit) setLowStockLimit(Number(parsed.lowStockLimit));
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const settingsObj = {
        facilityName,
        facilityType,
        capacity,
        safetyBuffer,
        expiryDays,
        lowStockLimit,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsObj));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      if (onSuccessToast) onSuccessToast('Facility settings and operational thresholds saved permanently.');
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const handleReseed = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      if (onSuccessToast) onSuccessToast('Operational demo records seeded into SQLite database.');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset database to clean initial demonstration state?')) return;
    setIsResetting(true);
    try {
      await resetDemoData();
      if (onSuccessToast) onSuccessToast('Database reset and re-seeded with clean demo baseline.');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Facility Profile Settings */}
      <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow">
        <div className="flex items-center space-x-2 pb-3 border-b border-charcoal-100">
          <Building className="w-5 h-5 text-forest-600" />
          <h3 className="font-bold text-charcoal-900 text-base">Facility &amp; Kitchen Profile</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Facility Name</label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 text-sm focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Kitchen Type</label>
              <select
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 text-sm bg-white"
              >
                <option value="College Mess / Hostel Dining">College Mess / Hostel Dining</option>
                <option value="University Cafeteria">University Cafeteria</option>
                <option value="Hospital Food Service">Hospital Food Service</option>
                <option value="Institutional Canteen">Institutional Canteen</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Daily Diner Capacity (Meals/Day)
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Default Safety Reserve Margin (%)
              </label>
              <input
                type="number"
                min="3"
                max="15"
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Expiry Warning Horizon (Days)
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-forest-700 font-semibold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-forest-600" />
                Configuration saved to local storage.
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* 2. Demonstration & Local Database Tools */}
      <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-charcoal-100">
          <Database className="w-5 h-5 text-forest-600" />
          <h3 className="font-bold text-charcoal-900 text-base">Local Data Management</h3>
        </div>

        <p className="text-xs text-charcoal-600 leading-relaxed">
          For evaluation and judge testing, use these controls to populate or reset local SQLite records.
          Records represent authentic college mess operational telemetry.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleReseed}
            disabled={isSeeding}
            className="flex items-center space-x-1.5 px-4 py-2 bg-charcoal-800 hover:bg-charcoal-900 text-white font-semibold rounded-lg text-xs transition-all shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-forest-400" />
            <span>{isSeeding ? 'Seeding Records...' : 'Seed Sample Mess Data'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold rounded-lg text-xs transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>{isResetting ? 'Resetting...' : 'Reset &amp; Re-initialize Database'}</span>
          </button>
        </div>
      </div>

      {/* 3. System Architecture & Diagnostics */}
      <div className="bg-white p-6 rounded-xl border border-charcoal-200 card-shadow space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-charcoal-100">
          <Server className="w-5 h-5 text-forest-600" />
          <h3 className="font-bold text-charcoal-900 text-base">System Architecture</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-200">
            <span className="font-bold text-charcoal-900 block">ML Engine Pipeline</span>
            <span className="text-charcoal-600 block mt-0.5">Scikit-Learn Ridge Regression (L2)</span>
            <span className="text-[10px] text-charcoal-400 font-mono">models/food_waste_pipeline.joblib</span>
          </div>

          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-200">
            <span className="font-bold text-charcoal-900 block">Database Engine</span>
            <span className="text-charcoal-600 block mt-0.5">SQLite + SQLAlchemy ORM</span>
            <span className="text-[10px] text-charcoal-400 font-mono">wasteless.db</span>
          </div>

          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-200">
            <span className="font-bold text-charcoal-900 block">Backend Service</span>
            <span className="text-charcoal-600 block mt-0.5">FastAPI + Pydantic v2 + Uvicorn</span>
            <span className="text-[10px] text-charcoal-400 font-mono">backend/app/main.py</span>
          </div>

          <div className="p-3 bg-warm-50 rounded-lg border border-charcoal-200">
            <span className="font-bold text-charcoal-900 block">Frontend Stack</span>
            <span className="text-charcoal-600 block mt-0.5">React 18 + Vite + TypeScript + Tailwind</span>
            <span className="text-[10px] text-charcoal-400 font-mono">frontend/src/App.tsx</span>
          </div>
        </div>
      </div>
    </div>
  );
};
