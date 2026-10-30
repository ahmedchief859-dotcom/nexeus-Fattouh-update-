import { Eye, MoreHorizontal, ArrowRight } from 'lucide-react';
import { orders, type OrderStatus } from '@/data/mockData';

const statusStyle: Record<OrderStatus, string> = {
  Delivered: 'bg-green-400/10 text-green-400 border-green-400/20',
  Pending: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  Processing: 'bg-nexora-accent/10 text-nexora-accent border-nexora-accent/20',
};

export default function OrdersTable() {
  return (
    <div className="glass glass-hover rounded-2xl p-5 lg:p-6 animate-slide-up delay-200">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-white text-base">Latest Orders</h3>
          <p className="text-xs text-white/40 mt-0.5">{orders.length} recent transactions</p>
        </div>
        <button className="flex items-center gap-1 text-xs text-nexora-accent hover:text-nexora-accent-2 transition-colors px-3 py-1.5 rounded-lg bg-nexora-accent/10 hover:bg-nexora-accent/15">
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-white/30 border-b border-white/5">
              <th className="pb-3 font-medium">Order ID</th>
              <th className="pb-3 font-medium">Client</th>
              <th className="pb-3 font-medium text-right">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                <td className="py-3.5">
                  <span className="font-mono text-xs text-white/70">{o.id}</span>
                </td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-nexora-accent/30 to-purple-400/30 flex items-center justify-center text-[10px] font-semibold text-white/80">
                      {o.client.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <span className="text-sm text-white/85">{o.client}</span>
                  </div>
                </td>
                <td className="py-3.5 text-right">
                  <span className="font-display font-semibold text-white text-sm">${o.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </td>
                <td className="py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyle[o.status]}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {o.status}
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
