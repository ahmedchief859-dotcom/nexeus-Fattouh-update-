import { useState, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import MetricCards from '@/components/dashboard/MetricCards';
import { SalesChart, CategoryDonut } from '@/components/dashboard/Charts';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import OrdersTable from '@/components/dashboard/OrdersTable';
import AppointmentsTracker from '@/components/dashboard/AppointmentsTracker';
import TopProducts from '@/components/dashboard/TopProducts';
import StoreManagement from '@/components/dashboard/StoreManagement';
import BusinessHealthGauge from '@/components/dashboard/BusinessHealthGauge';
import InvoiceEngine from '@/components/dashboard/InvoiceEngine';
import SubscriptionDashboard from '@/components/dashboard/SubscriptionDashboard';
import VoiceCopilot from '@/components/dashboard/VoiceCopilot';
import CommandDock from '@/components/dashboard/CommandDock';
import { metrics } from '@/data/mockData';
import { useBranches } from '@/lib/storeApi';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import ErrorBoundary from '@/components/system/ErrorBoundary';
import InlineAssistant from '@/components/dashboard/InlineAssistant';
import { useI18n } from '@/lib/i18n';

interface Props {
  onLogout: () => void;
}

interface Toast { id: number; msg: string; ok: boolean; }

export default function DashboardWorkspace({ onLogout }: Props) {
  const [active, setActive] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { branches } = useBranches();
  const { locale, direction, toggleLocale, t } = useI18n();

  const toast = useCallback((msg: string, ok = true) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, msg, ok }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3000);
  }, []);

  const voiceCtx = { navigate: setActive, toast };

  const navigate = (id: string) => { setActive(id); setSidebarOpen(false); };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-nexora flex">
      {/* Ambient background meshes */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-nexora-accent/[0.06] blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/[0.06] blur-[140px] pointer-events-none" />

      <Sidebar
        active={active}
        onSelect={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header onMenu={() => setSidebarOpen(true)} onToggleAI={() => setAiOpen(true)} />

        <main dir={direction} className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 space-y-5 lg:space-y-6 pb-28 lg:pb-6">
          {active === 'store' && <StoreManagement />}
          {active === 'invoices' && <InvoiceEngine onToast={toast} />}
          {active === 'subscription' && <SubscriptionDashboard />}
          {active === 'home' && (
            <>
              {/* Page header */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-fade-in">
                <div>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold text-white">Welcome back, Ahmed</h2>
                  <p className="text-sm text-white/45 mt-1">Here's your business at a glance — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActive('invoices')} className="px-4 py-2 rounded-xl glass text-sm text-white/70 hover:text-white hover:bg-white/[0.08] transition-all">New Invoice</button>
                  <button onClick={() => setActive('subscription')} className="px-4 py-2 rounded-xl bg-nexora-accent text-nexora-deep text-sm font-display font-semibold hover:bg-nexora-accent-2 transition-all shadow-lg shadow-nexora-accent/20">Manage Plan</button>
                </div>
              </div>

              {/* Metrics */}
              <MetricCards metrics={metrics} />
              <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2"><InlineAssistant /></div>
                <button type="button" onClick={toggleLocale} className="glass rounded-2xl px-4 py-3 text-start text-sm text-white/75 transition hover:border-cyan-200/40" aria-label="Toggle interface language">{t('Interface language', 'لغة الواجهة')}<span className="mt-1 block font-display text-lg font-semibold text-cyan-200">{locale === 'en' ? 'English · LTR' : locale === 'ar' ? 'العربية · RTL' : 'Deutsch · LTR'}</span></button>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
                <div className="xl:col-span-2"><SalesChart /></div>
                <div><CategoryDonut /></div>
              </div>

              {/* Orders + Activity */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
                <div className="xl:col-span-2"><OrdersTable /></div>
                <div><ActivityFeed /></div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
                <div><AppointmentsTracker /></div>
                <div><TopProducts /></div>
                <BusinessHealthGauge />
              </div>
            </>
          )}

          {active !== 'home' && active !== 'store' && active !== 'invoices' && active !== 'subscription' && (
            <ModuleView page={active} onNavigate={navigate} />
          )}

          <footer className="pt-4 pb-2 text-center text-xs text-white/25">
            NEXORA Business OS · v3.0 · © 2027 NEXORA Systems. All rights reserved.
          </footer>
        </main>
      </div>

      {/* Toast stack */}
      <div className="fixed top-20 right-4 z-[80] space-y-2 pointer-events-none" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className="glass-strong rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-2xl border animate-slide-up pointer-events-auto" style={{ borderColor: t.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)' }}>
            {t.ok ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
            <span className="text-sm text-white/90">{t.msg}</span>
            <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} className="text-white/30 hover:text-white/60 ml-1" aria-label="Dismiss notification">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <VoiceCopilot open={aiOpen} onClose={() => setAiOpen(false)} ctx={voiceCtx} />

      <CommandDock
        onVoice={() => setAiOpen(true)}
        onInvoice={() => setActive('invoices')}
        branches={branches}
        activeBranchId={branches[0]?.id ?? null}
        onBranchChange={() => { setActive('store'); }}
        onNavigate={navigate}
      />
    </div>
    </ErrorBoundary>
  );
}

function ModuleView({ page, onNavigate }: { page: string; onNavigate: (id: string) => void }) {
  const labels: Record<string, string> = {
    sales: 'Sales', inventory: 'Inventory', customers: 'Customers', accounting: 'Accounting',
    reports: 'Reports', suppliers: 'Suppliers', employees: 'Employees', branches: 'Branches', settings: 'Settings',
  };
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl glass-strong flex items-center justify-center mb-5">
        <span className="font-display text-2xl font-bold text-nexora-accent">{(labels[page] ?? page)[0]}</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-white">{labels[page] ?? page}</h2>
      <p className="text-sm text-white/55 mt-2 max-w-lg">Manage your {labels[page]?.toLowerCase() ?? page} from one secure workspace. Your live Supabase data and operational metrics stay in sync as you work.</p>
      <div className="flex flex-wrap justify-center gap-3 mt-7">
        <button onClick={() => onNavigate('home')} className="px-4 py-2 rounded-xl glass text-sm text-white/80 hover:text-white">Back to overview</button>
        {page !== 'store' && <button onClick={() => onNavigate('store')} className="px-4 py-2 rounded-xl bg-nexora-accent text-nexora-deep text-sm font-semibold">Open store management</button>}
      </div>
    </div>
  );
}
