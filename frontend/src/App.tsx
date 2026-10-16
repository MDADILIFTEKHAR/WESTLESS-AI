import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewView } from './views/OverviewView';
import { PredictionView } from './views/PredictionView';
import { WasteLogsView } from './views/WasteLogsView';
import { InventoryView } from './views/InventoryView';
import { SurplusView } from './views/SurplusView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { fetchSummary, fetchInsights } from './services/api';
import type { DashboardSummary, InsightsData } from './types';
import { CheckCircle2, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [sum, ins] = await Promise.all([
        fetchSummary().catch(() => null),
        fetchInsights().catch(() => null),
      ]);
      setSummary(sum);
      setInsights(ins);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="flex min-h-screen bg-warm-50 text-charcoal-900 font-sans">
      {/* Sidebar with responsive mobile drawer support */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelTrained={summary?.model_status?.is_trained ?? true}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              summary={summary}
              insights={insights}
              setActiveTab={setActiveTab}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'prediction' && (
            <PredictionView onSuccessToast={showToast} />
          )}

          {activeTab === 'waste-logs' && (
            <WasteLogsView onSuccessToast={showToast} />
          )}

          {activeTab === 'inventory' && (
            <InventoryView onSuccessToast={showToast} />
          )}

          {activeTab === 'surplus' && (
            <SurplusView onSuccessToast={showToast} />
          )}

          {activeTab === 'insights' && (
            <InsightsView />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onSuccessToast={showToast}
              onRefreshAll={() => loadData(true)}
            />
          )}
        </main>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-charcoal-900 text-white px-4 py-3 rounded-xl shadow-lg border border-charcoal-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-forest-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-charcoal-400 hover:text-white rounded ml-2"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
