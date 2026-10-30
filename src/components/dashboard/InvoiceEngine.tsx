import { useEffect, useState, useMemo, FormEvent } from 'react';
import {
  FileText, Plus, Trash2, Printer, Download, X, Loader2, Search,
  CheckCircle2, Clock, Send, FilePlus, DollarSign,
} from 'lucide-react';
import {
  fetchInvoices, createInvoice, updateInvoiceStatus, deleteInvoice,
  type Invoice, type InvoiceLineItem,
} from '@/lib/erpApi';

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'SAR', symbol: 'ر.س' },
];

const statusConfig: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
  paid: { icon: CheckCircle2, cls: 'bg-green-400/10 text-green-400 border-green-400/20' },
  sent: { icon: Send, cls: 'bg-nexora-accent/10 text-nexora-accent border-nexora-accent/20' },
  draft: { icon: Clock, cls: 'bg-white/10 text-white/50 border-white/15' },
};

export default function InvoiceEngine({ onToast }: { onToast: (msg: string, ok?: boolean) => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await fetchInvoices();
    if (error) onToast(error, false);
    else setInvoices(data ?? []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return invoices;
    const l = search.toLowerCase();
    return invoices.filter((i) => i.invoice_number.toLowerCase().includes(l) || i.client_name.toLowerCase().includes(l));
  }, [invoices, search]);

  const totalValue = invoices.reduce((s, i) => s + Number(i.total), 0);
  const paidValue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await updateInvoiceStatus(id, status);
    if (error) onToast(error, false);
    else { onToast(`Invoice marked as ${status}`, true); load(); }
  };

  const handleDelete = async (id: string, num: string) => {
    const { error } = await deleteInvoice(id);
    if (error) onToast(error, false);
    else { onToast(`Deleted ${num}`, true); load(); }
  };

  const handlePrint = (inv: Invoice) => {
    const html = generateInvoiceHTML(inv);
    const w = window.open('', '_blank');
    if (!w) { onToast('Allow popups to print invoices', false); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="space-y-5 lg:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-nexora-accent" />
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white">Billing Engine</h2>
          </div>
          <p className="text-sm text-white/45">Generate itemized invoices with VAT routing and multi-currency support.</p>
        </div>
        <button onClick={() => setShowGen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nexora-accent text-nexora-deep text-sm font-display font-semibold hover:bg-nexora-accent-2 transition-all shadow-lg shadow-nexora-accent/20">
          <FilePlus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Invoices" value={String(invoices.length)} color="#7ee8e8" />
        <StatCard label="Total Value" value={formatMoney(totalValue, 'USD')} color="#a78bfa" />
        <StatCard label="Paid" value={formatMoney(paidValue, 'USD')} color="#34d399" />
        <StatCard label="Outstanding" value={formatMoney(totalValue - paidValue, 'USD')} color="#fbbf24" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice number or client..." className="w-full pl-10 pr-4 py-3 rounded-xl glass text-sm text-white placeholder-white/30 outline-none focus:border-nexora-accent/40 transition-all" />
      </div>

      {/* Invoice list */}
      <div className="glass rounded-2xl p-5 lg:p-6 animate-slide-up">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-sm text-white/40">No invoices found. Create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-white/30 border-b border-white/5">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const sc = statusConfig[inv.status] ?? statusConfig.draft;
                  const SIcon = sc.icon;
                  const cur = CURRENCIES.find((c) => c.code === inv.currency) ?? CURRENCIES[0];
                  return (
                    <tr key={inv.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5">
                        <p className="font-mono text-sm text-white/90">{inv.invoice_number}</p>
                        <p className="text-[11px] text-white/35">{new Date(inv.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3.5">
                        <p className="text-sm text-white/85">{inv.client_name}</p>
                        <p className="text-[11px] text-white/35">{inv.client_email}</p>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="font-display font-semibold text-white text-sm">{cur.symbol}{Number(inv.total).toFixed(2)}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${sc.cls}`}>
                          <SIcon className="w-3 h-3" /> {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setPreviewInvoice(inv)} className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/60 hover:text-white transition-colors">View</button>
                          <button onClick={() => handlePrint(inv)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-nexora-accent transition-colors" title="Print / PDF"><Printer className="w-3.5 h-3.5" /></button>
                          {inv.status !== 'paid' && (
                            <button onClick={() => handleStatusChange(inv.id, 'paid')} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-green-400 transition-colors" title="Mark paid"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => handleDelete(inv.id, inv.invoice_number)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-300 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Generator modal */}
      {showGen && <GeneratorModal onClose={() => setShowGen(false)} onCreated={(num) => { setShowGen(false); load(); onToast(`Invoice ${num} created`, true); }} onToast={onToast} />}

      {/* Preview modal */}
      {previewInvoice && <PreviewModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} onPrint={() => handlePrint(previewInvoice)} />}
    </div>
  );
}

// ---------- Generator Modal ----------
function GeneratorModal({ onClose, onCreated, onToast }: { onClose: () => void; onCreated: (num: string) => void; onToast: (m: string, ok?: boolean) => void }) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [vatRate, setVatRate] = useState('15');
  const [items, setItems] = useState<InvoiceLineItem[]>([{ name: '', qty: 1, unitPrice: 0, total: 0 }]);
  const [saving, setSaving] = useState(false);

  const cur = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const vatAmount = subtotal * (Number(vatRate) / 100);
  const total = subtotal + vatAmount;

  const updateItem = (idx: number, field: keyof InvoiceLineItem, val: string | number) => {
    setItems((its) => its.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      if (field === 'qty' || field === 'unitPrice') {
        updated.total = Number(updated.qty) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const addItem = () => setItems((its) => [...its, { name: '', qty: 1, unitPrice: 0, total: 0 }]);
  const removeItem = (idx: number) => setItems((its) => its.filter((_, i) => i !== idx));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || items.some((i) => !i.name.trim())) { onToast('Fill in client name and all item names', false); return; }
    setSaving(true);
    const { id, error } = await createInvoice({
      client_name: clientName, client_email: clientEmail,
      line_items: items, subtotal, vat_rate: Number(vatRate), vat_amount: vatAmount, total, currency,
    });
    setSaving(false);
    if (error) onToast(error, false);
    else onCreated(`INV-${String(Date.now()).slice(-4)}`);
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-nexora-mid/80 backdrop-blur-lg py-1 -mx-6 px-6 z-10">
          <h3 className="font-display font-semibold text-white text-lg">Generate Invoice</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Client Name</label>
              <input required value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} placeholder="Sarah Khalil" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Client Email</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={inputCls} placeholder="client@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code} className="bg-nexora-deep">{c.code} ({c.symbol})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">VAT Rate (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Line Items</label>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-nexora-accent hover:text-nexora-accent-2"><Plus className="w-3.5 h-3.5" /> Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input required value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Item name" className={`${inputCls} col-span-5`} />
                  <input required type="number" min="1" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} placeholder="Qty" className={`${inputCls} col-span-2 text-center`} />
                  <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} placeholder="Price" className={`${inputCls} col-span-2 text-right`} />
                  <span className="col-span-2 text-right text-sm font-display font-semibold text-white tabular-nums">{cur.symbol}{item.total.toFixed(2)}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="col-span-1 p-2 rounded-lg text-white/30 hover:text-red-300 hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-white/50">Subtotal</span><span className="text-white font-medium">{cur.symbol}{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/50">VAT ({vatRate}%)</span><span className="text-white font-medium">{cur.symbol}{vatAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-base pt-2 border-t border-white/10"><span className="text-white font-display font-semibold">Total</span><span className="text-nexora-accent font-display font-bold text-lg">{cur.symbol}{total.toFixed(2)}</span></div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl glass text-sm text-white/70 hover:text-white transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-nexora-accent text-nexora-deep text-sm font-display font-semibold hover:bg-nexora-accent-2 transition-all disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FilePlus className="w-4 h-4" /> Create Invoice</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Preview Modal ----------
function PreviewModal({ invoice, onClose, onPrint }: { invoice: Invoice; onClose: () => void; onPrint: () => void }) {
  const cur = CURRENCIES.find((c) => c.code === invoice.currency) ?? CURRENCIES[0];
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-strong rounded-2xl p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-white text-lg">{invoice.invoice_number}</h3>
          <div className="flex items-center gap-2">
            <button onClick={onPrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nexora-accent/15 text-nexora-accent text-xs font-medium hover:bg-nexora-accent/25 transition-colors"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30">Bill To</p>
              <p className="text-sm font-medium text-white mt-1">{invoice.client_name}</p>
              <p className="text-xs text-white/40">{invoice.client_email}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/30">Date</p>
              <p className="text-sm text-white/70 mt-1">{new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-white/10"><th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">Item</th><th className="text-center py-2.5 px-2 text-[10px] uppercase text-white/30">Qty</th><th className="text-right py-2.5 px-3 text-[10px] uppercase text-white/30">Total</th></tr></thead>
              <tbody>
                {invoice.line_items.map((item, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="py-2.5 px-3 text-sm text-white/80">{item.name}</td>
                    <td className="py-2.5 px-2 text-center text-sm text-white/60">{item.qty}</td>
                    <td className="py-2.5 px-3 text-right text-sm text-white/80 font-medium">{cur.symbol}{Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-white/50">Subtotal</span><span className="text-white">{cur.symbol}{Number(invoice.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/50">VAT ({invoice.vat_rate}%)</span><span className="text-white">{cur.symbol}{Number(invoice.vat_amount).toFixed(2)}</span></div>
            <div className="flex justify-between text-base pt-2 border-t border-white/10"><span className="text-white font-display font-semibold">Total</span><span className="text-nexora-accent font-display font-bold">{cur.symbol}{Number(invoice.total).toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass glass-hover rounded-2xl p-4 lg:p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: color }} />
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
      <p className="font-display text-xl lg:text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function formatMoney(val: number, currency: string) {
  const cur = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  return `${cur.symbol}${val.toFixed(2)}`;
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-nexora-accent/40 transition-all";

// ---------- Print HTML ----------
function generateInvoiceHTML(inv: Invoice): string {
  const cur = CURRENCIES.find((c) => c.code === inv.currency) ?? CURRENCIES[0];
  const itemsHTML = inv.line_items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td class="center">${item.qty}</td>
      <td class="right">${cur.symbol}${Number(item.unitPrice).toFixed(2)}</td>
      <td class="right">${cur.symbol}${Number(item.total).toFixed(2)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html><head><title>${inv.invoice_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 24px; font-weight: 800; color: #0b0c10; }
  .brand span { color: #7ee8e8; }
  .inv-num { font-size: 28px; font-weight: 700; color: #232946; }
  .bill-to { margin-bottom: 30px; }
  .bill-to h3 { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 5px; }
  .bill-to p { font-size: 15px; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  thead th { text-align: left; padding: 12px; border-bottom: 2px solid #232946; font-size: 11px; text-transform: uppercase; color: #888; }
  tbody td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
  .center { text-align: center; } .right { text-align: right; }
  .totals { margin-left: auto; width: 300px; }
  .totals div { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .totals .total { border-top: 2px solid #232946; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; }
  .totals .total span:last-child { color: #0b8b8b; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <div><div class="brand">NEXORA<span> Business OS</span></div><p style="font-size:12px;color:#888;margin-top:4px;">Enterprise ERP Platform</p></div>
    <div style="text-align:right;"><div class="inv-num">${inv.invoice_number}</div><p style="font-size:12px;color:#888;margin-top:4px;">${new Date(inv.created_at).toLocaleDateString()}</p></div>
  </div>
  <div class="bill-to"><h3>Bill To</h3><p>${escapeHtml(inv.client_name)}</p><p style="color:#888;font-size:13px;">${escapeHtml(inv.client_email)}</p></div>
  <table><thead><tr><th>Item</th><th class="center">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead><tbody>${itemsHTML}</tbody></table>
  <div class="totals">
    <div><span>Subtotal</span><span>${cur.symbol}${Number(inv.subtotal).toFixed(2)}</span></div>
    <div><span>VAT (${inv.vat_rate}%)</span><span>${cur.symbol}${Number(inv.vat_amount).toFixed(2)}</span></div>
    <div class="total"><span>Total</span><span>${cur.symbol}${Number(inv.total).toFixed(2)}</span></div>
  </div>
  <div class="footer">This invoice was generated by NEXORA Business OS. Payment due within 30 days.</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
