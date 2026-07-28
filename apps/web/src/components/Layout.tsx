import { Navigate, Outlet } from 'react-router-dom';
import { Role } from '@gig/shared';
import { useAuth } from '../context/AuthContext';
import { Button, ConnectionBadge } from '../components/ui';
import { NotificationBell } from '../components/NotificationBell';
import { useSocket } from '../lib/socket';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 tracking-wide">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <Outlet />;
}

function homeForRole(role: Role): string {
  if (role === Role.ADMIN) return '/admin';
  if (role === Role.COMPANY) return '/company';
  return '/rider';
}

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const roleLabel = user?.role === Role.ADMIN ? 'Admin' : user?.role === Role.COMPANY ? 'Company' : 'Rider';
  const roleColor = user?.role === Role.ADMIN
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : user?.role === Role.COMPANY
    ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          {/* Left: Brand + Page title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-900/40">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-500 leading-none">GigWorforce</p>
                <h1 className="text-sm font-semibold text-white leading-tight">{title}</h1>
              </div>
            </div>
            <div className="hidden sm:block h-5 w-px bg-white/10" />
            <span className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleColor}`}>
              {roleLabel}
            </span>
          </div>

          {/* Right: Status + actions */}
          <div className="flex items-center gap-3">
            <ConnectionBadge connected={connected} />
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 border border-white/8">
              <div className="h-5 w-5 rounded-full bg-brand-600/40 flex items-center justify-center text-[10px] font-bold text-brand-300">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-xs text-slate-300 max-w-[120px] truncate">{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              className="!px-3 !py-1.5 !text-xs"
              onClick={logout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}

