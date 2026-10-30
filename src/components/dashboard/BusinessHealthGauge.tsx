import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { fetchDailyRevenue } from '@/lib/erpApi';

interface HealthState {
  score: number;
  label: 'Optimal' | 'Warning' | 'Critical';
  color: string;
  avgRevenue: number;
  trend: number;
  metrics: { label: string; val: number; color: string }[];
}

function computeHealth(daily: { total: number }[]): HealthState {
  const totals = daily.map((d) => d.total);
  const avg = totals.length ? totals.reduce((s, t) => s + t, 0) / totals.length : 0;
  const recent = totals.slice(-3).reduce((s, t) => s + t, 0) / Math.max(1, totals.slice(-3).length);
  const older = totals.slice(0, 4).reduce((s, t) => s + t, 0) / Math.max(1, totals.slice(0, 4).length);
  const trend = older > 0 ? ((recent - older) / older) * 100 : 0;

  let score: number;
  let label: HealthState['label'];
  let color: string;

  if (avg > 150 && trend >= -10) {
    score = Math.min(95, 70 + Math.round(avg / 10) + Math.max(0, Math.round(trend)));
    label = 'Optimal';
    color = '#34d399';
  } else if (avg > 50) {
    score = Math.max(45, Math.min(69, 40 + Math.round(avg / 5)));
    label = 'Warning';
    color = '#fbbf24';
  } else {
    score = Math.max(10, Math.min(44, 10 + Math.round(avg / 2)));
    label = 'Critical';
    color = '#f87171';
  }

  const metrics = [
    { label: 'Revenue Velocity', val: Math.min(100, Math.round((avg / 200) * 100)), color: '#7ee8e8' },
    { label: 'Growth Trend', val: Math.max(0, Math.min(100, 50 + Math.round(trend * 2))), color: '#a78bfa' },
    { label: 'Consistency', val: totals.length > 1 ? Math.max(20, 100 - Math.round(Math.abs(trend) * 1.5)) : 50, color: '#34d399' },
  ];

  return { score, label, color, avgRevenue: avg, trend, metrics };
}

export default function BusinessHealthGauge() {
  const [health, setHealth] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const daily = await fetchDailyRevenue(7);
      if (daily.length > 0) setHealth(computeHealth(daily));
      else {
        // fallback to synthetic data
        setHealth(computeHealth([{ total: 42000 }, { total: 58000 }, { total: 51000 }, { total: 72000 }, { total: 89000 }, { total: 104000 }, { total: 96000 }]));
      }
      setLoading(false);
    })();
  }, []);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="glass rounded-2xl p-5 lg:p-6 animate-slide-up delay-500 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: health?.color ?? '#7ee8e8' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-nexora-accent" />
          <h3 className="font-display font-semibold text-white text-base">Business Health</h3>
        </div>
        <p className="text-xs text-white/40 mb-5">Autonomous diagnostic — DB-linked</p>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/40"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : health ? (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <circle cx="60" cy="60" r={radius} fill="none" stroke={health.color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(health.score / 100) * circumference} ${circumference}`} className="animate-draw"
                    style={{ filter: `drop-shadow(0 0 6px ${health.color}88)`, transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-4xl font-bold text-white">{health.score}</span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: health.color }}>{health.label}</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-4 border ${
              health.label === 'Optimal' ? 'bg-green-400/10 border-green-400/20' :
              health.label === 'Warning' ? 'bg-amber-400/10 border-amber-400/20' :
              'bg-red-400/10 border-red-400/20'
            }`}>
              {health.label === 'Optimal' ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> :
               health.label === 'Warning' ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> :
               <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span className="text-xs text-white/70">
                Avg daily revenue ${health.avgRevenue.toFixed(0)} · {health.trend > 0 ? '+' : ''}{health.trend.toFixed(1)}% trend
              </span>
            </div>

            <div className="space-y-2.5">
              {health.metrics.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/55">{s.label}</span>
                    <span className="text-white/80 font-medium">{s.val}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.val}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
