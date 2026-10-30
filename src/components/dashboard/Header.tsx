import { useState } from 'react';
import { Search, Bell, Sparkles, Menu, ChevronDown, Calendar, X } from 'lucide-react';

interface Props {
  onMenu: () => void;
  onToggleAI: () => void;
}

export default function Header({ onMenu, onToggleAI }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const notifications = [
    { id: 1, title: 'New order received', desc: 'Order #ORD-2049 from Sarah K.', time: '2m', unread: true },
    { id: 2, title: 'Low stock warning', desc: 'Organic Milk below threshold', time: '15m', unread: true },
    { id: 3, title: 'Payment processed', desc: '$2,190 from Yasmin Adel', time: '1h', unread: true },
    { id: 4, title: 'Weekly report ready', desc: 'Sales summary available', time: '3h', unread: false },
  ];
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/5 px-4 lg:px-6 h-16 flex items-center gap-3 lg:gap-5">
      {/* Mobile menu */}
      <button onClick={onMenu} className="lg:hidden text-white/60 hover:text-white p-1">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xl hidden sm:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Global search — orders, products, customers..."
          className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-nexora-accent/40 focus:bg-white/[0.05] transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Calendar widget */}
      <div className="hidden xl:flex items-center gap-2.5 px-3 py-2 rounded-xl glass">
        <Calendar className="w-4 h-4 text-nexora-accent" />
        <div className="leading-tight">
          <p className="text-xs text-white/40">Today</p>
          <p className="text-xs font-medium text-white/80">{today}</p>
        </div>
      </div>

      {/* AI Assistant */}
      <button
        onClick={onToggleAI}
        className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-nexora-accent/15 to-purple-400/15 border border-nexora-accent/20 hover:border-nexora-accent/40 transition-all"
      >
        <Sparkles className="w-4 h-4 text-nexora-accent group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline text-xs font-medium text-white/80">AI Assistant</span>
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative p-2 rounded-xl glass hover:bg-white/[0.08] transition-colors"
        >
          <Bell className="w-[18px] h-[18px] text-white/70" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-nexora-accent text-nexora-deep text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-12 z-50 w-80 glass-strong rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-top-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <h3 className="font-display font-semibold text-white text-sm">Notifications</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-nexora-accent/20 text-nexora-accent font-medium">{unread} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer ${n.unread ? 'bg-nexora-accent/[0.03]' : ''}`}>
                    <div className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-nexora-accent' : 'bg-white/20'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">{n.title}</p>
                        <p className="text-xs text-white/45 truncate">{n.desc}</p>
                        <p className="text-[10px] text-white/30 mt-1">{n.time} ago</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-2.5 text-xs text-nexora-accent hover:bg-white/[0.03] transition-colors border-t border-white/5">
                View all notifications
              </button>
            </div>
          </>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-2.5 pl-2 lg:pl-3 lg:border-l border-white/10 cursor-pointer group">
        <div className="relative">
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-nexora-accent to-purple-400 flex items-center justify-center font-display font-bold text-nexora-deep text-sm">
            AM
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-nexora-deep" />
        </div>
        <div className="hidden lg:block leading-tight">
          <p className="text-sm font-medium text-white/90">Ahmed Mohamed</p>
          <p className="text-[11px] text-white/40">Store Manager</p>
        </div>
        <ChevronDown className="w-4 h-4 text-white/30 hidden lg:block group-hover:text-white/60 transition-colors" />
      </div>
    </header>
  );
}
