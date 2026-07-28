import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Role } from '@gig/shared';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('company-a@gig.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    const dest = user.role === Role.ADMIN ? '/admin' : user.role === Role.COMPANY ? '/company' : '/rider';
    return <Navigate to={dest} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    { role: 'Admin', email: 'admin@gig.local', icon: '🛡️', color: 'border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5' },
    { role: 'Company', email: 'company-a@gig.local', icon: '🏢', color: 'border-brand-500/30 hover:border-brand-500/60 hover:bg-brand-500/5' },
    { role: 'Rider', email: 'rider1@gig.local', icon: '🛵', color: 'border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5' },
  ];

  return (
    <div className="flex min-h-screen bg-surface-900">

      {/* ─── Left panel (brand) ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/60 via-surface-800 to-surface-900" />
        <div className="absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-brand-700/20 blur-[120px] -translate-x-1/4 -translate-y-1/4 pointer-events-none" />

        {/* Brand logo */}
        <div className="relative flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-xl shadow-brand-900/60">
            <span className="text-xl font-black text-white">G</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-400 leading-none">GigWorforce</p>
            <p className="text-sm text-slate-400">Real-Time Workforce Platform</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Real-time gigs,<br />
            <span className="gradient-text-light">delivered instantly.</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
            The operating system for gig workforce management. Companies post, riders receive, and payouts flow — all in real time.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '⚡', label: 'Socket.IO Real-Time' },
              { icon: '🛡️', label: 'KYC Verified Riders' },
              { icon: '📊', label: 'Live Analytics' },
              { icon: '💸', label: 'UPI Instant Payouts' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/8 px-3 py-2.5">
                <span className="text-lg">{f.icon}</span>
                <span className="text-xs font-medium text-slate-300">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} GigWorforce · Built for scale</p>
        </div>
      </div>

      {/* ─── Right panel (form) ─────────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800">
            <span className="text-base font-black text-white">G</span>
          </div>
          <span className="text-sm font-bold text-brand-400 uppercase tracking-widest">GigWorforce</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white mb-2">Welcome back</h1>
            <p className="text-sm text-slate-400">Sign in to your workspace</p>
          </div>

          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email address</label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                <span>✕</span> {error}
              </div>
            )}

            <Button id="login-submit" type="submit" className="w-full !py-3 text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">
              Demo accounts · password123
            </p>
            <div className="grid gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => setEmail(a.email)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-all duration-200 w-full ${a.color}`}
                >
                  <span>{a.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-300">{a.role}</p>
                    <p className="text-xs text-slate-500 truncate">{a.email}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-600">→</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            <button onClick={() => navigate('/')} className="hover:text-slate-400 transition">
              ← Back to home
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


