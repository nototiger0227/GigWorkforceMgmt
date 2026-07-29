import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Role } from '@gig/shared';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import { api, ApiError } from '../lib/api';

export function RegisterPage() {
  const { user, setAuth } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'RIDER' | 'COMPANY'>('RIDER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    const dest = user.role === Role.ADMIN ? '/admin' : user.role === Role.COMPANY ? '/company' : '/rider';
    return <Navigate to={dest} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const payload: Record<string, string> = { email, password, role };
      if (role === 'COMPANY') payload.companyName = companyName;

      const res = await api<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuth(res.token, res.user);
    } catch (err: any) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(err.details);
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-surface-900">
      <div className="flex w-full flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-white mb-2">Create an account</h1>
            <p className="text-sm text-slate-400">Join GigWorkforce today</p>
          </div>

          <div className="flex p-1 bg-surface-800 rounded-xl mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'RIDER' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setRole('RIDER')}
            >
              Rider
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'COMPANY' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setRole('COMPANY')}
            >
              Company
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && <p className="text-xs font-medium text-red-400 mt-0.5">{fieldErrors.email[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {fieldErrors.password && <p className="text-xs font-medium text-red-400 mt-0.5">{fieldErrors.password[0]}</p>}
            </div>

            {role === 'COMPANY' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company Name</label>
                <Input
                  type="text"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                {fieldErrors.companyName && <p className="text-xs font-medium text-red-400 mt-0.5">{fieldErrors.companyName[0]}</p>}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                <span>✕</span> {error}
              </div>
            )}

            <Button type="submit" className="w-full !py-3 text-base" isLoading={loading}>
              Sign up
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-brand-400 hover:text-brand-300 font-semibold transition">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
