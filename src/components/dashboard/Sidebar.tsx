import { Home, Store, ShoppingCart, Package, Users, Calculator, BarChart3, Truck, UserCircle, Building2, Settings, LogOut, X, FileText, Crown } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  badge?: string;
}

export const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'store', label: 'Store Management', icon: Store },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, badge: '12' },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'accounting', label: 'Accounting', icon: Calculator },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'employees', label: 'Employees', icon: UserCircle },
  { id: 'branches', label: 'Branches', icon: Building2 },
  { id: 'invoices', label: 'Billing & Invoices', icon: FileText },
  { id: 'subscription', label: 'Subscription', icon: Crown },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface Props {
  active: string;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function Sidebar({ active, onSelect, open, onClose, onLogout }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={onClose} />}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 z-50 lg:z-30
        glass-strong border-r border-white/10
        flex flex-col
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-nexora-accent/40 blur-md rounded-lg" />
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-nexora-accent to-nexora-accent-2 flex items-center justify-center">
                <span className="font-display font-bold text-nexora-deep text-sm">N</span>
              </div>
            </div>
            <div className="leading-tight">
              <h1 className="font-display font-bold text-white text-sm">NEXORA</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Business OS</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-nexora-accent/10 text-nexora-accent'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-nexora-accent" />}
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-nexora-accent' : 'text-white/45 group-hover:text-white/70'}`} strokeWidth={1.8} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-nexora-accent/20 text-nexora-accent">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Upgrade card */}
        <div className="px-3 pb-3">
          <div className="glass rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-nexora-accent/20 blur-2xl" />
            <p className="text-xs text-white/50 mb-1">Storage</p>
            <div className="flex items-end justify-between mb-2">
              <span className="font-display font-bold text-white text-lg">68%</span>
              <span className="text-[10px] text-white/40">42/64 GB</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-nexora-accent to-nexora-accent-2" style={{ width: '68%' }} />
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-red-300 hover:bg-red-400/10 transition-all">
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
