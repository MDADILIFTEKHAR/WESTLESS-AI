import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  Boxes,
  HeartHandshake,
  BarChart3,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  modelTrained?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  modelTrained = true,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'prediction', label: 'AI Waste Prediction', icon: Sparkles },
    { id: 'waste-logs', label: 'Waste Logs', icon: ClipboardList },
    { id: 'inventory', label: 'Inventory & Expiry', icon: Boxes },
    { id: 'surplus', label: 'Surplus Rescue', icon: HeartHandshake },
    { id: 'insights', label: 'Insights & Validation', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-charcoal-200 flex flex-col justify-between shrink-0 shadow-sm transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-charcoal-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/logo-icon.svg"
                alt="WasteLess AI Mark"
                className="w-9 h-9 shrink-0 drop-shadow-xs"
              />
              <div>
                <h1 className="font-bold text-lg text-charcoal-900 tracking-tight flex items-center gap-1.5 leading-none">
                  Waste<span className="text-forest-600 font-extrabold">Less</span>
                  <span className="text-[10px] uppercase font-black bg-forest-600 text-white px-1.5 py-0.5 rounded-md">
                    AI
                  </span>
                </h1>
                <p className="text-[11px] text-charcoal-500 font-medium tracking-tight mt-1">
                  Food Prevention &amp; Recovery
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-forest-50 text-forest-800 border border-forest-200 shadow-xs'
                      : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-forest-600' : 'text-charcoal-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer System Status */}
        <div className="p-4 border-t border-charcoal-100 bg-warm-50/60">
          <div className="p-3 rounded-lg border border-charcoal-200 bg-white space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-charcoal-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                ML Engine
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  modelTrained ? 'bg-forest-100 text-forest-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {modelTrained ? 'Trained v1.0' : 'Fallback Demo'}
              </span>
            </div>
            <p className="text-[11px] text-charcoal-500 leading-snug">
              Ridge Regression L2 on Kaggle tabular mess records. R² = 0.920 | RMSE = 7.22 kg
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
