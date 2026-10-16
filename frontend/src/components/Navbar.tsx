import React from 'react';
import { RefreshCw, UtensilsCrossed, Calendar, Menu } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onToggleMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onRefresh,
  isRefreshing = false,
  onToggleMobile,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Kitchen Sustainability Dashboard',
      subtitle: 'Real-time waste monitoring, measured inventory alerts, and rescue metrics',
    },
    prediction: {
      title: 'AI Food Waste Prediction & Batch Sizing',
      subtitle: 'Model-backed unconsumed food forecasting with safety buffer margins',
    },
    'waste-logs': {
      title: 'Food Waste & Leftover Logs',
      subtitle: 'Measured kitchen scale logs: prepared vs served vs unconsumed food',
    },
    inventory: {
      title: 'Inventory & Shelf-Life Tracker',
      subtitle: 'Deterministic expiry alerts and batch management to prevent spoilage',
    },
    surplus: {
      title: 'Surplus Food Rescue & Verification',
      subtitle: 'Audited redistribution workflow for verified local community kitchens',
    },
    insights: {
      title: 'Impact Analytics & ML Model Validation',
      subtitle: 'Statistical evaluation on held-out 2024 test split and category insights',
    },
    settings: {
      title: 'System Settings & Kitchen Profile',
      subtitle: 'Operational parameters, threshold margins, and demonstration controls',
    },
  };

  const current = titles[activeTab] || {
    title: 'WasteLess AI',
    subtitle: 'Food Waste Prevention Platform',
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-charcoal-200 px-4 sm:px-8 py-3.5 sticky top-0 z-10 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        {/* Mobile menu toggle */}
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="md:hidden p-2 text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile logo icon visible on narrow screens */}
        <div className="md:hidden flex items-center space-x-2">
          <img src="/logo-icon.svg" alt="WasteLess AI" className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 tracking-tight leading-tight">
            {current.title}
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5 hidden sm:block">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Date & Facility badge */}
        <div className="hidden lg:flex items-center space-x-3 text-xs text-charcoal-600 bg-warm-50 px-3 py-1.5 rounded-lg border border-charcoal-200">
          <span className="flex items-center gap-1.5 font-medium">
            <UtensilsCrossed className="w-3.5 h-3.5 text-forest-600" />
            Hostel Dining Hall #3
          </span>
          <span className="text-charcoal-300">|</span>
          <span className="flex items-center gap-1.5 text-charcoal-500">
            <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
            {todayStr}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-charcoal-50 border border-charcoal-200 text-charcoal-700 text-xs font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-2xs"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-forest-600' : 'text-charcoal-500'}`} />
          <span className="hidden sm:inline">Sync Data</span>
        </button>
      </div>
    </header>
  );
};
