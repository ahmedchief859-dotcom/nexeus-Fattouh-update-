import { TrendingUp, Flame, MoreHorizontal } from 'lucide-react';
import { topProducts } from '@/data/mockData';

const gradients: Record<string, string> = {
  drink: 'from-amber-500/30 to-orange-600/20',
  bread: 'from-yellow-600/30 to-amber-700/20',
  serum: 'from-teal-500/30 to-emerald-600/20',
  tote: 'from-slate-500/30 to-gray-600/20',
  matcha: 'from-green-500/30 to-lime-600/20',
};

const emoji: Record<string, string> = {
  drink: '☕',
  bread: '🥖',
  serum: '🧴',
  tote: '👜',
  matcha: '🍵',
};

export default function TopProducts() {
  return (
    <div className="glass glass-hover rounded-2xl p-5 lg:p-6 animate-slide-up delay-400">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="font-display font-semibold text-white text-base">Top-Selling Products</h3>
          </div>
          <p className="text-xs text-white/40">Best performers this month</p>
        </div>
        <button className="text-white/30 hover:text-white/60 p-1"><MoreHorizontal className="w-4 h-4" /></button>
      </div>

      <div className="space-y-2">
        {topProducts.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
            <span className="font-display text-xs font-bold text-white/20 w-4 text-center">{i + 1}</span>
            <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[p.image]} flex items-center justify-center text-xl shrink-0 border border-white/5`}>
              {emoji[p.image]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{p.name}</p>
              <p className="text-[11px] text-white/40">{p.category} · {p.sold} sold</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display font-semibold text-white text-sm">{p.revenue}</p>
              <p className={`text-[10px] ${p.stock < 50 ? 'text-amber-400' : 'text-white/35'}`}>{p.stock} in stock</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
