import { useState, FormEvent } from 'react';
import { Shield, Lock, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

const MASTER_PASSWORD = '#117007';

export default function DeploymentGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (password === MASTER_PASSWORD) {
        onUnlock();
      } else {
        setError(true);
        setAttempts((a) => a + 1);
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-nexora flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-nexora-accent/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03] animate-spin-slow" />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-nexora-accent/30 blur-xl rounded-2xl animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-2xl glass-strong flex items-center justify-center glow-accent">
              <Shield className="w-8 h-8 text-nexora-accent" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            NEXORA <span className="text-gradient-accent">Business OS</span>
          </h1>
          <p className="text-white/40 text-sm mt-2 font-body">Global Protection Gateway</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-nexora-accent/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-nexora-accent" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Deployment Shield</h2>
              <p className="text-xs text-white/45">Enter master deployment password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Master Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                autoFocus
                placeholder="••••••••"
                className={`w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border text-white placeholder-white/25 text-base outline-none transition-all font-body ${
                  error
                    ? 'border-red-400/50 bg-red-400/5 focus:border-red-400/70'
                    : 'border-white/10 focus:border-nexora-accent/50 focus:bg-white/[0.05]'
                }`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/30 animate-slide-up">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm text-red-300">Access denied. Incorrect master password{attempts > 1 ? ` (${attempts} attempts)` : ''}.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-nexora-accent text-nexora-deep font-display font-semibold text-base hover:bg-nexora-accent-2 transition-all duration-300 disabled:opacity-70 shadow-lg shadow-nexora-accent/20 hover:shadow-nexora-accent/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Unlock Deployment
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
            <span className="font-body">Secured by NEXORA Guard</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              System online
            </span>
          </div>
        </div>

        <p className="text-center text-white/25 text-xs mt-6 font-body">
          Authorized personnel only. All access attempts are logged.
        </p>
      </div>
    </div>
  );
}
