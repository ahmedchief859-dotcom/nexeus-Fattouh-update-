import { useState } from 'react';
import { Activity, ShoppingCart, Package, UserPlus, PackageCheck, Server, Clock } from 'lucide-react';
import { activities, type Activity as ActivityType } from '@/data/mockData';

const iconFor = (t: ActivityType['type']) => ({
  sale: ShoppingCart,
  inventory: Package,
  customer: UserPlus,
  order: PackageCheck,
  system: Server,
}[t]);

const colorFor = (t: ActivityType['type']) => ({
  sale: '#7ee8e8',
  inventory: '#a78bfa',
  customer: '#fbbf24',
  order: '#34d399',
  system: '#94a3b8',
}[t]);

export default function ActivityFeed() {
  const [items, setItems] = useState(activities);

  return (
    <div className="glass glass-hover rounded-2xl p-5 lg:p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-nexora-accent" />
          <h3 className="font-display font-semibold text-white text-base">Recent Activity</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </span>
      </div>

      <div className="relative space-y-1 max-h-[420px] overflow-y-auto pr-1">
        {/* timeline line */}
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/5" />
        {items.map((a) => {
          const Icon = iconFor(a.type);
          const color = colorFor(a.type);
          return (
            <div key={a.id} className="relative flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors group">
              <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 glass-strong" style={{ border: `1px solid ${color}33` }}>
                <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm text-white/85 leading-snug">{a.message}</p>
                <p className="flex items-center gap-1 text-[11px] text-white/35 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {a.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
