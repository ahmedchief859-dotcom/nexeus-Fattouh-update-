import { useState } from 'react';
import { ScanLine, Mic, FilePlus, Building2, Grid3x3, X, ChevronDown, Check } from 'lucide-react';
import { navItems } from '@/components/dashboard/Sidebar';
import type { Branch } from '@/lib/storeApi';

interface Props {
  onVoice: () => void;
  onInvoice: () => void;
  branches: Branch[];
  activeBranchId: string | null;
  onBranchChange: (id: string) => void;
  onNavigate: (id: string) => void;
}

export default function CommandDock({ onVoice, onInvoice, branches, activeBranchId, onBranchChange, onNavigate }: Props) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);

  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const handleScan = () => {
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 1500);
  };

  return (
    <>
      {/* Barcode scan flash overlay */}
      {scanFlash && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-64 h-40 rounded-2xl overflow-hidden glass-strong border-2 border-nexora-accent/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-nexora-accent animate-pulse" style={{ animation: 'scanline 1.5s linear', boxShadow: '0 0 20px #7ee8e8' }} />
              </div>
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="inline-block w-0.5 bg-white/40 mx-px" style={{ height: `${30 + Math.random() * 50}%`, marginTop: `${15 + Math.random() * 20}%` }} />
              ))}
            </div>
            <p className="text-sm text-nexora-accent font-display font-medium">Scanning barcode...</p>
          </div>
        </div>
      )}

      {/* Mega Menu */}
      {megaOpen && (
        <>
          <div className="fixed inset-0 z-[65] bg-black/60 animate-fade-in" onClick={() => setMegaOpen(false)} />
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[66] w-[calc(100vw-2rem)] max-w-2xl glass-strong rounded-3xl p-6 animate-scale-in origin-bottom" style={{ backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-nexora-accent" />
                <h3 className="font-display font-semibold text-white text-lg">Site Map Explorer</h3>
              </div>
              <button onClick={() => setMegaOpen(false)} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMegaOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-nexora-accent/30 hover:bg-nexora-accent/[0.05] transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/5 group-hover:bg-nexora-accent/15 flex items-center justify-center transition-colors">
                      <Icon className="w-4.5 h-4.5 text-white/50 group-hover:text-nexora-accent transition-colors" strokeWidth={1.8} />
                    </div>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Branch switcher dropdown */}
      {branchOpen && (
        <>
          <div className="fixed inset-0 z-[63]" onClick={() => setBranchOpen(false)} />
          <div className="fixed bottom-24 right-4 z-[64] w-56 glass-strong rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-bottom-right">
            <p className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-widest border-b border-white/5">Switch Branch</p>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => { onBranchChange(b.id); setBranchOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-white/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/85 truncate">{b.name}</p>
                  <p className="text-[10px] text-white/35">{b.code}</p>
                </div>
                {b.id === activeBranchId && <Check className="w-4 h-4 text-nexora-accent shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* The dock */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
        <div className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-2xl glass-strong shadow-2xl border border-white/10" style={{ backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' }}>
          <DockButton icon={ScanLine} label="Scan" onClick={handleScan} color="#7ee8e8" />
          <DockButton icon={Mic} label="Voice" onClick={onVoice} color="#a78bfa" />
          <DockButton icon={FilePlus} label="Invoice" onClick={onInvoice} color="#34d399" />
          <div className="w-px h-8 bg-white/10 mx-0.5" />
          <button
            onClick={() => setBranchOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <Building2 className="w-4 h-4 text-white/50" />
            <span className="text-xs font-medium text-white/70 max-w-[60px] truncate">{activeBranch?.name.split(' ')[0] ?? 'Branch'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${branchOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="w-px h-8 bg-white/10 mx-0.5" />
          <button
            onClick={() => setMegaOpen((o) => !o)}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-nexora-accent/20 to-purple-400/20 border border-nexora-accent/20 flex items-center justify-center hover:from-nexora-accent/30 hover:to-purple-400/30 transition-all"
          >
            <Grid3x3 className="w-5 h-5 text-nexora-accent" />
          </button>
        </div>
      </div>
    </>
  );
}

function DockButton({ icon: Icon, label, onClick, color }: { icon: typeof Mic; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all active:scale-95 group relative"
      style={{ background: `${color}10` }}
    >
      <Icon className="w-4.5 h-4.5 transition-colors" style={{ color }} strokeWidth={1.8} />
      <span className="sr-only">{label}</span>
      <span className="absolute -top-7 px-2 py-1 rounded-md glass text-[10px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{label}</span>
    </button>
  );
}
