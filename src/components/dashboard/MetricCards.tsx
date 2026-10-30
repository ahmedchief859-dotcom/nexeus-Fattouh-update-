import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { Sparkline } from '@/components/charts/Charts';
import type { MetricCard as MetricCardType } from '@/data/mockData';

const iconMap = {
  profit: DollarSign,
  sales: ShoppingCart,
  inventory: Package,
  customers: Users,
};

export default function MetricCards({ metrics }: { metrics: MetricCardType[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((m, i) => {
        const Icon = iconMap[m.icon];
        const up = m.trend === 'up';
        return (
          <div
            key={m.id}
            className="glass glass-hover rounded-2xl p-5 relative overflow-hidden group animate-slide-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40" style={{ background: m.color }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${m.color}1a`, border: `1px solid ${m.color}33` }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} strokeWidth={1.8} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  up ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                }`}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.change > 0 ? '+' : ''}{m.change}%
                </div>
              </div>
              <p className="text-xs text-white/45 uppercase tracking-wider mb-1">{m.label}</p>
              <p className="font-display text-2xl font-bold text-white mb-3">{m.value}</p>
              <div className="flex items-end justify-between">
                <span className="text-[11px] text-white/30">vs last month</span>
                <Sparkline data={m.spark} color={m.color} width={110} height={36} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
