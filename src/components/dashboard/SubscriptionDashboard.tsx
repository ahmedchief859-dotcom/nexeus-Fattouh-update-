import { useEffect, useState } from 'react';
import {
  Crown, Zap, HardDrive, Users, Wifi, Check, Loader2, TrendingUp,
  Server, Activity, ShieldCheck, ArrowUpRight,
} from 'lucide-react';
import { fetchUsage, type UsageMetric } from '@/lib/erpApi';

const metricMeta: Record<string, { label: string; icon: typeof Zap; color: string; unit: string }> = {
  api_calls: { label: 'API Gateway Calls', icon: Zap, color: '#7ee8e8', unit: '' },
  storage_gb: { label: 'Server Storage', icon: HardDrive, color: '#a78bfa', unit: ' GB' },
  seats: { label: 'Active Seats', icon: Users, color: '#fbbf24', unit: '' },
  bandwidth_gb: { label: 'Bandwidth', icon: Wifi, color: '#34d399', unit: ' GB' },
};

const planFeatures = [
  'Unlimited branches & inventory items',
  'AI Cognitive Voice Co-Pilot',
  'Predictive forecasting engine',
  'PDF billing with multi-currency',
  'Real-time analytics dashboard',
  'Priority 24/7 enterprise support',
  'Custom API integrations',
  'Multi-tenant seat management',
];

export default function SubscriptionDashboard() {
  const [usage, setUsage] = useState<UsageMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await fetchUsage();
      if (!error) setUsage(data ?? []);
      setLoading(false);
    })();
  }, []);

  const overallUsage = usage.length > 0
    ? Math.round(usage.reduce((s, u) => s + (u.used / u.limit_value) * 100, 0) / usage.length)
    : 0;

  return (
    <div className="space-y-5 lg:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-nexora-accent" />
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white">Subscription Lifecycle</h2>
          </div>
          <p className="text-sm text-white/45">Monitor platform usage, manage your enterprise plan, and track resource allocation.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 text-xs font-medium border border-green-400/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Active
          </span>
        </div>
      </div>

      {/* Plan card */}
      <div className="glass-strong rounded-2xl p-6 lg:p-8 relative overflow-hidden animate-slide-up">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-nexora-accent/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-nexora-accent/40 blur-lg rounded-xl" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-nexora-accent to-purple-400 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-nexora-deep" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-white">NEXORA Enterprise</h3>
                <p className="text-sm text-white/40">Annual subscription · renews Oct 2027</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {planFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-white/60">
                  <Check className="w-4 h-4 text-nexora-accent shrink-0" /> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center lg:text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Monthly Billing</p>
            <p className="font-display text-4xl font-bold text-white">$2,499<span className="text-lg text-white/40">/mo</span></p>
            <button className="mt-4 w-full lg:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-nexora-accent to-nexora-accent-2 text-nexora-deep font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-nexora-accent/20">
              Manage Plan
            </button>
          </div>
        </div>
      </div>

      {/* Overall usage ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center animate-slide-up delay-100">
          <h3 className="font-display font-semibold text-white text-base mb-1">Platform Utilization</h3>
          <p className="text-xs text-white/40 mb-5">Aggregate resource usage</p>
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          ) : (
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#7ee8e8" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(overallUsage / 100) * 327} 327`} className="animate-draw"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(126,232,232,0.5))', transition: 'stroke-dasharray 1s' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-bold text-white">{overallUsage}<span className="text-xl text-white/40">%</span></span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Used</span>
              </div>
            </div>
          )}
        </div>

        {/* Hardware meters */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-16 text-white/40"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            usage.map((u, i) => {
              const meta = metricMeta[u.metric] ?? metricMeta.api_calls;
              const pct = Math.min(100, Math.round((u.used / u.limit_value) * 100));
              const Icon = meta.icon;
              return (
                <div key={u.id} className="glass glass-hover rounded-2xl p-5 relative overflow-hidden animate-slide-up" style={{ animationDelay: `${0.15 + i * 0.1}s` }}>
                  <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-20" style={{ background: meta.color }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}33` }}>
                        <Icon className="w-5 h-5" style={{ color: meta.color }} strokeWidth={1.8} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${pct > 85 ? 'bg-red-400/10 text-red-400' : pct > 70 ? 'bg-amber-400/10 text-amber-400' : 'bg-green-400/10 text-green-400'}`}>
                        {pct > 85 ? 'Critical' : pct > 70 ? 'High' : 'Healthy'}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">{meta.label}</p>
                    <div className="flex items-end justify-between mt-1 mb-3">
                      <p className="font-display text-xl font-bold text-white">{formatNum(u.used)}{meta.unit}</p>
                      <p className="text-[11px] text-white/35">of {formatNum(u.limit_value)}{meta.unit}</p>
                    </div>
                    {/* Radial-style progress bar */}
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`, boxShadow: `0 0 8px ${meta.color}66` }} />
                    </div>
                    {/* Tick marks */}
                    <div className="flex justify-between mt-1.5">
                      {[0, 25, 50, 75, 100].map((tick) => (
                        <span key={tick} className="text-[8px] text-white/20">{tick}%</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Activity + billing history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-5 lg:p-6 animate-slide-up delay-300">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-nexora-accent" />
            <h3 className="font-display font-semibold text-white text-base">Recent Activity</h3>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'API call surge detected', time: '2m ago', val: '+12k calls', color: '#7ee8e8' },
              { label: 'New seat added: Ahmed M.', time: '1h ago', val: '18/25 seats', color: '#fbbf24' },
              { label: 'Storage threshold 65%', time: '3h ago', val: '41.6 GB', color: '#a78bfa' },
              { label: 'Bandwidth spike — Branch B', time: '6h ago', val: '+8.4 GB', color: '#34d399' },
              { label: 'Invoice INV-0002 sent', time: '1d ago', val: '$172.50', color: '#7ee8e8' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color, boxShadow: `0 0 6px ${a.color}66` }} />
                <span className="text-sm text-white/70 flex-1">{a.label}</span>
                <span className="text-xs text-white/40">{a.val}</span>
                <span className="text-[10px] text-white/25 w-16 text-right">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:p-6 animate-slide-up delay-400">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-nexora-accent" />
            <h3 className="font-display font-semibold text-white text-base">Billing History</h3>
          </div>
          <div className="space-y-2.5">
            {[
              { date: 'Oct 2026', amount: '$2,499.00', status: 'Paid' },
              { date: 'Sep 2026', amount: '$2,499.00', status: 'Paid' },
              { date: 'Aug 2026', amount: '$2,499.00', status: 'Paid' },
              { date: 'Jul 2026', amount: '$2,499.00', status: 'Paid' },
              { date: 'Jun 2026', amount: '$2,499.00', status: 'Paid' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                <TrendingUp className="w-4 h-4 text-green-400/60" />
                <span className="text-sm text-white/70 flex-1">{b.date}</span>
                <span className="text-sm font-display font-medium text-white">{b.amount}</span>
                <span className="flex items-center gap-1 text-[10px] text-green-400 px-2 py-0.5 rounded-md bg-green-400/10">
                  <Check className="w-2.5 h-2.5" /> {b.status}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
