import { useState, FormEvent } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertTriangle, Loader2, ShieldCheck, KeyRound } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export default function LoginCard({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [forgot, setForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (!email.includes('@') || password.length < 1) {
        setError('Invalid email or password. Please try again.');
        return;
      }
      setSuccess(true);
      setTimeout(onLogin, 700);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-nexora flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-nexora-accent/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-2xl animate-pulse-glow" />
            <div className="relative w-14 h-14 rounded-2xl glass-strong flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-green-400" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-white/40 text-xs font-body uppercase tracking-widest">Deployment Unlocked</p>
          <h1 className="font-display text-2xl font-bold text-white mt-2">Secure Sign In</h1>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          {forgot ? (
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-nexora-accent/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6 text-nexora-accent" />
              </div>
              <h2 className="font-display text-lg font-semibold text-white mb-2">Reset Password</h2>
              <p className="text-sm text-white/50 mb-5">Enter your email and we'll send a secure reset link.</p>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/25 text-sm outline-none focus:border-nexora-accent/50 mb-4"
              />
              <button
                onClick={() => { setForgot(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000); }}
                className="w-full px-4 py-3 rounded-xl bg-nexora-accent text-nexora-deep font-display font-semibold hover:bg-nexora-accent-2 transition-all mb-2"
              >
                Send Reset Link
              </button>
              <button onClick={() => setForgot(false)} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ahmed@nexora.io"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.03] border text-white placeholder-white/25 text-sm outline-none transition-all ${
                      error ? 'border-red-400/50' : 'border-white/10 focus:border-nexora-accent/50'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-11 py-3.5 rounded-xl bg-white/[0.03] border text-white placeholder-white/25 text-sm outline-none transition-all ${
                      error ? 'border-red-400/50' : 'border-white/10 focus:border-nexora-accent/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className="flex items-center gap-2.5 group"
                >
                  <span className={`w-4.5 h-4.5 rounded-md border transition-all flex items-center justify-center ${
                    remember ? 'bg-nexora-accent border-nexora-accent' : 'border-white/20 bg-white/[0.03]'
                  }`}>
                    {remember && <span className="w-2 h-2 rounded-sm bg-nexora-deep" />}
                  </span>
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Remember me</span>
                </button>
                <button type="button" onClick={() => setForgot(true)} className="text-sm text-nexora-accent/80 hover:text-nexora-accent transition-colors">
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/30 animate-slide-up">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-400/10 border border-green-400/30 animate-slide-up">
                  <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-sm text-green-300">Authentication successful. Loading workspace...</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-nexora-accent text-nexora-deep font-display font-semibold text-base hover:bg-nexora-accent-2 transition-all duration-300 disabled:opacity-70 shadow-lg shadow-nexora-accent/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In Securely <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
            <span className="font-body flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> End-to-end encrypted</span>
            <span>v2.4.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
