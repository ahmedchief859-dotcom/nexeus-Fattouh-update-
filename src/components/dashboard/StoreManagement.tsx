import { useMemo, useState, FormEvent, useEffect } from 'react';
import {
  Store, MapPin, User, ChevronDown, Plus, Minus, Package, AlertTriangle,
  TrendingUp, Search, ArrowRightLeft, Trash2, X, Loader2, CheckCircle2, Layers, DollarSign,
} from 'lucide-react';
import {
  useBranches, useBranchInventory, adjustStock, addInventoryItem, deleteInventoryItem,
  transferStock, itemStatus, type Branch, type InventoryStatus,
} from '@/lib/storeApi';

const statusStyles: Record<InventoryStatus, string> = {
  'in-stock': 'bg-green-400/10 text-green-400 border-green-400/20',
  'low-stock': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'out-of-stock': 'bg-red-400/10 text-red-400 border-red-400/20',
};

const branchStatusStyle: Record<Branch['status'], string> = {
  active: 'bg-green-400/10 text-green-400 border-green-400/20',
  maintenance: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  closed: 'bg-red-400/10 text-red-400 border-red-400/20',
};

export default function StoreManagement() {
  const { branches, loading: branchesLoading } = useBranches();
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [transferItem, setTransferItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!activeBranchId && branches.length > 0) setActiveBranchId(branches[0].id);
  }, [branches, activeBranchId]);

  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? null;
  const { items, loading: invLoading, refetch } = useBranchInventory(activeBranchId);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchSearch = !search ||
        i.product_name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || i.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  const summary = useMemo(() => {
    const totalSkus = items.length;
    const totalUnits = items.reduce((s, i) => s + i.stock, 0);
    const lowCount = items.filter((i) => itemStatus(i) === 'low-stock').length;
    const outCount = items.filter((i) => itemStatus(i) === 'out-of-stock').length;
    const stockValue = items.reduce((s, i) => s + i.stock * Number(i.unit_price), 0);
    return { totalSkus, totalUnits, lowCount, outCount, stockValue };
  }, [items]);

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const handleAdjust = async (id: string, delta: number) => {
    const { error } = await adjustStock(id, delta);
    if (error) flash(error, false);
    else { await refetch(); flash(delta > 0 ? `Added ${delta} units` : `Removed ${Math.abs(delta)} units`); }
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await deleteInventoryItem(id);
    if (error) flash(error, false);
    else { await refetch(); flash(`Removed "${name}" from inventory`); }
  };

  const handleAdd = async (form: AddForm) => {
    if (!activeBranchId) return;
    const { error } = await addInventoryItem({
      branch_id: activeBranchId,
      product_name: form.product_name,
      sku: form.sku,
      category: form.category,
      stock: Number(form.stock),
      reorder_level: Number(form.reorder_level),
      unit_price: Number(form.unit_price),
    });
    if (error) flash(error, false);
    else { await refetch(); setShowAdd(false); flash(`Added "${form.product_name}"`); }
  };

  const handleTransfer = async (itemId: string, toBranchId: string, qty: number) => {
    if (!activeBranchId) return;
    const { error } = await transferStock(itemId, activeBranchId, toBranchId, qty);
    if (error) flash(error, false);
    else { await refetch(); setTransferItem(null); flash(`Transferred ${qty} units`); }
  };

  if (branchesLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-white/40">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-[60] animate-slide-up">
          <div className={`glass-strong rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-2xl border ${toast.ok ? 'border-green-400/30' : 'border-red-400/30'}`}>
            {toast.ok ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span className="text-sm text-white/90">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-nexora-accent" />
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white">Store Management</h2>
          </div>
          <p className="text-sm text-white/45">Switch branches, monitor stock, and allocate inventory across locations.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nexora-accent text-nexora-deep text-sm font-display font-semibold hover:bg-nexora-accent-2 transition-all shadow-lg shadow-nexora-accent/20"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Branch switcher + filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Branch selector */}
        <div className="lg:col-span-1 relative">
          <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Active Branch</label>
          <button
            onClick={() => setBranchMenuOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl glass hover:bg-white/[0.08] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-nexora-accent/15 flex items-center justify-center shrink-0">
                <MapPin className="w-4.5 h-4.5 text-nexora-accent" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">{activeBranch?.name ?? 'Select branch'}</p>
                <p className="text-[11px] text-white/40 truncate">{activeBranch?.code} · {activeBranch?.location}</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform shrink-0 ${branchMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {branchMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBranchMenuOpen(false)} />
              <div className="absolute left-0 right-0 top-full mt-2 z-50 glass-strong rounded-xl shadow-2xl overflow-hidden animate-scale-in origin-top">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setActiveBranchId(b.id); setBranchMenuOpen(false); setCategoryFilter('all'); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-0 ${b.id === activeBranchId ? 'bg-nexora-accent/[0.05]' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{b.name}</p>
                      <p className="text-[11px] text-white/40 truncate">{b.code} · {b.manager}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${branchStatusStyle[b.status]}`}>{b.status}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Search</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product name or SKU..."
              className="w-full pl-10 pr-4 py-3.5 rounded-xl glass text-sm text-white placeholder-white/30 outline-none focus:border-nexora-accent/40 transition-all"
            />
          </div>
        </div>

        {/* Category filter */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Category</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${categoryFilter === 'all' ? 'bg-nexora-accent text-nexora-deep' : 'glass text-white/60 hover:text-white'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${categoryFilter === c ? 'bg-nexora-accent text-nexora-deep' : 'glass text-white/60 hover:text-white'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Branch info card */}
      {activeBranch && (
        <div className="glass rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-nexora-accent/20 to-purple-400/20 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-nexora-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-white truncate">{activeBranch.name}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${branchStatusStyle[activeBranch.status]}`}>{activeBranch.status}</span>
              </div>
              <p className="text-xs text-white/40 mt-0.5 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {activeBranch.location}</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {activeBranch.manager}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Layers} label="Total SKUs" value={String(summary.totalSkus)} color="#7ee8e8" delay={0} />
        <SummaryCard icon={Package} label="Units in Stock" value={summary.totalUnits.toLocaleString()} color="#a78bfa" delay={0.1} />
        <SummaryCard icon={DollarSign} label="Stock Value" value={`$${summary.stockValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} color="#34d399" delay={0.2} />
        <SummaryCard icon={AlertTriangle} label="Low / Out" value={`${summary.lowCount} / ${summary.outCount}`} color="#fbbf24" delay={0.3} />
      </div>

      {/* Inventory table */}
      <div className="glass rounded-2xl p-5 lg:p-6 animate-slide-up delay-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-white text-base">Inventory Allocation — {activeBranch?.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">{filtered.length} items · adjust stock, transfer, or remove</p>
          </div>
        </div>

        {invLoading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-sm text-white/40">No inventory items match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-white/30 border-b border-white/5">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-center">Stock</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const status = itemStatus(item);
                  return (
                    <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5">
                        <p className="text-sm font-medium text-white/90">{item.product_name}</p>
                        <p className="text-[11px] text-white/35 font-mono">{item.sku}</p>
                      </td>
                      <td className="py-3.5">
                        <span className="text-xs text-white/60">{item.category}</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="font-display font-semibold text-white text-sm">${Number(item.unit_price).toFixed(2)}</span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleAdjust(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-400/15 text-white/50 hover:text-red-300 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-display font-bold text-white text-base w-10 text-center tabular-nums">{item.stock}</span>
                          <button
                            onClick={() => handleAdjust(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-green-400/15 text-white/50 hover:text-green-300 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-white/30 text-center mt-1">reorder @ {item.reorder_level}</p>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyles[status]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {status === 'in-stock' ? 'In Stock' : status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setTransferItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-nexora-accent transition-colors"
                            title="Transfer to another branch"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.product_name)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-300 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add product modal */}
      {showAdd && activeBranchId && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}

      {/* Transfer modal */}
      {transferItem && activeBranchId && (
        <TransferModal
          item={items.find((i) => i.id === transferItem)!}
          branches={branches.filter((b) => b.id !== activeBranchId)}
          onClose={() => setTransferItem(null)}
          onTransfer={handleTransfer}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, delay }: { icon: typeof Package; label: string; value: string; color: string; delay: number }) {
  return (
    <div className="glass glass-hover rounded-2xl p-4 lg:p-5 relative overflow-hidden animate-slide-up" style={{ animationDelay: `${delay}s` }}>
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: color }} />
      <div className="relative">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} strokeWidth={1.8} />
        </div>
        <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
        <p className="font-display text-xl lg:text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

// ---------- Add Product Modal ----------
interface AddForm {
  product_name: string;
  sku: string;
  category: string;
  stock: string;
  reorder_level: string;
  unit_price: string;
}

function AddProductModal({ categories, onClose, onAdd }: { categories: string[]; onClose: () => void; onAdd: (f: AddForm) => void }) {
  const [form, setForm] = useState<AddForm>({
    product_name: '', sku: '', category: categories[0] ?? 'Drinks',
    stock: '0', reorder_level: '10', unit_price: '0',
  });
  const [saving, setSaving] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onAdd(form);
    setSaving(false);
  };

  return (
    <ModalShell title="Add Product" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Product Name">
          <input required value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })}
            className={inputCls} placeholder="e.g. Organic Cold Brew" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SKU">
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className={inputCls} placeholder="SN-788" />
          </Field>
          <Field label="Category">
            <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls} placeholder="Drinks" list="cats" />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Stock">
            <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Reorder Level">
            <input required type="number" min="0" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Unit Price ($)">
            <input required type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl glass text-sm text-white/70 hover:text-white transition-all">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-nexora-accent text-nexora-deep text-sm font-display font-semibold hover:bg-nexora-accent-2 transition-all disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add to Inventory</>}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ---------- Transfer Modal ----------
function TransferModal({ item, branches, onClose, onTransfer }: {
  item: { id: string; product_name: string; sku: string; stock: number; category: string };
  branches: Branch[];
  onClose: () => void;
  onTransfer: (itemId: string, toBranchId: string, qty: number) => void;
}) {
  const [toBranch, setToBranch] = useState(branches[0]?.id ?? '');
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!toBranch || qty < 1) return;
    setSaving(true);
    onTransfer(item.id, toBranch, qty);
    setSaving(false);
  };

  return (
    <ModalShell title="Transfer Stock" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-nexora-accent/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-nexora-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{item.product_name}</p>
            <p className="text-[11px] text-white/40 font-mono">{item.sku} · {item.stock} available</p>
          </div>
        </div>
        <Field label="Destination Branch">
          <select value={toBranch} onChange={(e) => setToBranch(e.target.value)} className={inputCls}>
            {branches.map((b) => <option key={b.id} value={b.id} className="bg-nexora-deep">{b.name} ({b.code})</option>)}
          </select>
        </Field>
        <Field label="Quantity to Transfer">
          <input required type="number" min="1" max={item.stock} value={qty} onChange={(e) => setQty(Math.min(item.stock, Math.max(1, Number(e.target.value))))} className={inputCls} />
          <p className="text-[11px] text-white/30 mt-1">Max {item.stock} units available</p>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl glass text-sm text-white/70 hover:text-white transition-all">Cancel</button>
          <button type="submit" disabled={saving || !toBranch} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-nexora-accent text-nexora-deep text-sm font-display font-semibold hover:bg-nexora-accent-2 transition-all disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRightLeft className="w-4 h-4" /> Transfer</>}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ---------- Shared modal bits ----------
const inputCls = "w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-nexora-accent/40 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md glass-strong rounded-2xl p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-white text-lg">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
