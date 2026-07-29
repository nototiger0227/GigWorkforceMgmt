import { GigStatus, Urgency } from '@gig/shared';
import clsx from 'clsx';

// ─── Status & Urgency maps ────────────────────────────────────────────────────

const statusStyles: Record<GigStatus, string> = {
  OPEN:        'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  ASSIGNED:    'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  IN_PROGRESS: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  COMPLETED:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  CANCELLED:   'bg-slate-500/15 text-slate-400 border border-slate-500/30',
};

const urgencyStyles: Record<Urgency, string> = {
  LOW:      'text-slate-400',
  MEDIUM:   'text-violet-400',
  HIGH:     'text-orange-400',
  CRITICAL: 'text-red-400 font-semibold',
};

const urgencyDotStyles: Record<Urgency, string> = {
  LOW:      'bg-slate-500',
  MEDIUM:   'bg-violet-500',
  HIGH:     'bg-orange-500',
  CRITICAL: 'bg-red-500 animate-pulse',
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: GigStatus }) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
      statusStyles[status]
    )}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── UrgencyLabel ─────────────────────────────────────────────────────────────

export function UrgencyLabel({ urgency }: { urgency: Urgency }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider', urgencyStyles[urgency])}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', urgencyDotStyles[urgency])} />
      {urgency}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx(
      'glass-card rounded-2xl p-5 shadow-xl shadow-black/20',
      className
    )}>
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

const btnVariants: Record<ButtonVariant, string> = {
  primary:   'btn-primary text-white rounded-xl',
  secondary: 'bg-surface-600 hover:bg-surface-500 text-slate-100 border border-white/10 rounded-xl transition-all duration-200',
  danger:    'bg-red-600/90 hover:bg-red-600 text-white shadow-lg shadow-red-900/30 hover:shadow-red-800/40 rounded-xl transition-all duration-200',
  ghost:     'btn-ghost rounded-xl',
  outline:   'border border-brand-500/40 text-brand-400 hover:bg-brand-600/10 hover:border-brand-500/60 rounded-xl transition-all duration-200',
};

export function Button({
  children,
  variant = 'primary',
  className,
  isLoading,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; isLoading?: boolean }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed',
        btnVariants[variant],
        className,
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="input-field"
      {...props}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="input-field resize-none"
      {...props}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="input-field appearance-none cursor-pointer"
      {...props}
    />
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-red-400 mt-0.5">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
      {icon && <span className="mb-4 text-4xl opacity-40">{icon}</span>}
      <p className="text-base font-semibold text-slate-300">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}

// ─── ConnectionBadge ──────────────────────────────────────────────────────────

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        connected
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      )}
    >
      <span className={clsx(
        'h-1.5 w-1.5 rounded-full',
        connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
      )} />
      {connected ? 'Live' : 'Reconnecting…'}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ message, type = 'success', onClose }: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}) {
  const styles = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    error:   'bg-red-500/15 border-red-500/30 text-red-300',
    info:    'bg-brand-500/15 border-brand-500/30 text-brand-300',
  };
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div className={clsx(
      'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur-sm',
      styles[type]
    )}>
      <span className="text-base font-bold">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition">✕</button>
      )}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  label,
  title,
  action,
}: {
  label?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        {label && <p className="section-label mb-1">{label}</p>}
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'brand',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  color?: 'brand' | 'emerald' | 'amber' | 'red';
}) {
  const iconColors = {
    brand:   'bg-brand-600/20 text-brand-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    amber:   'bg-amber-600/20 text-amber-400',
    red:     'bg-red-600/20 text-red-400',
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
      {icon && (
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl text-lg flex-shrink-0', iconColors[color])}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

