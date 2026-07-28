import { useNavigate } from 'react-router-dom';

/* ─── Feature data ─────────────────────────────────────────────────────────── */
const features = [
  {
    icon: '⚡',
    title: 'Real-Time Matching',
    desc: 'Socket.IO powered gig board delivers new opportunities to riders in under 200ms. Zero latency between post and delivery.',
    color: 'from-violet-600/20 to-transparent',
    border: 'border-violet-500/20',
  },
  {
    icon: '🛡️',
    title: 'KYC Verification',
    desc: 'Multi-document rider identity verification (Aadhaar, PAN, DL) ensures every platform maintains a verified, trusted workforce.',
    color: 'from-emerald-600/20 to-transparent',
    border: 'border-emerald-500/20',
  },
  {
    icon: '📊',
    title: 'Live Analytics',
    desc: 'Instant dashboards for fill rate, surge multipliers, partner callbacks, and wallet payouts — updated in real time.',
    color: 'from-blue-600/20 to-transparent',
    border: 'border-blue-500/20',
  },
  {
    icon: '🗺️',
    title: 'Ops Map',
    desc: 'See every online rider and active gig on a live operational map. Dispatch and manage at scale with confidence.',
    color: 'from-amber-600/20 to-transparent',
    border: 'border-amber-500/20',
  },
  {
    icon: '💸',
    title: 'Instant Payouts',
    desc: 'Riders receive earnings directly to their UPI wallet. Companies get transparent payout audit trails.',
    color: 'from-pink-600/20 to-transparent',
    border: 'border-pink-500/20',
  },
  {
    icon: '🔗',
    title: 'Multi-Platform',
    desc: 'Aggregate riders across Swiggy, Zomato, Dunzo and more. One platform to manage your entire multi-source workforce.',
    color: 'from-cyan-600/20 to-transparent',
    border: 'border-cyan-500/20',
  },
];

const stats = [
  { value: '500+', label: 'Companies onboarded', sub: 'across 12 cities' },
  { value: '12K+', label: 'Active riders', sub: 'verified & ready' },
  { value: '< 200ms', label: 'Gig delivery', sub: 'real-time socket' },
  { value: '₹2Cr+', label: 'Payouts processed', sub: 'this month' },
];

const steps = [
  {
    step: '01',
    title: 'Company posts a gig',
    desc: 'Set urgency, pickup zone, pay, and preferred platforms. Gig is instantly broadcast via Socket.IO.',
  },
  {
    step: '02',
    title: 'Riders see it in real time',
    desc: 'Matched riders receive the gig on their live board instantly. Smart scoring surfaces best-fit riders first.',
  },
  {
    step: '03',
    title: 'Accept, deliver, get paid',
    desc: 'Rider accepts, starts, and completes the gig. Earnings land in their UPI wallet automatically.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-900 overflow-x-hidden">

      {/* ─── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-lg shadow-brand-900/50">
              <span className="text-lg font-black text-white">G</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400 leading-none">GigWorforce</p>
              <p className="text-xs text-slate-500 leading-tight">Real-Time Workforce Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-400 hover:text-white transition font-medium"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold text-white"
            >
              Get started →
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="hero-gradient relative px-6 pt-20 pb-24 text-center overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-brand-700/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-indigo-700/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 mb-8">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-semibold text-brand-300 tracking-wider uppercase">Socket.IO Powered Real-Time</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight">
            <span className="text-white">The Gig Workforce</span>
            <br />
            <span className="gradient-text-light">Operating System</span>
          </h1>

          <p className="mt-6 mx-auto max-w-2xl text-lg text-slate-400 leading-relaxed">
            Connect verified riders with companies in real time. Instant gig broadcasting, 
            smart matching, KYC verification, and automated UPI payouts — all in one platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-cta-company"
              onClick={() => navigate('/login')}
              className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-bold text-white animate-glow-pulse"
            >
              🏢 Post Your First Gig
            </button>
            <button
              id="hero-cta-rider"
              onClick={() => navigate('/login')}
              className="btn-ghost w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold"
            >
              🛵 Join as a Rider
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-surface-800/50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="stat-number">{s.value}</p>
                <p className="mt-2 text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-slate-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features grid ───────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Platform capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything you need to run a gig operation</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">Built for speed, reliability, and scale. One platform handles your end-to-end gig operations workflow.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} rounded-2xl`} />
                <div className="relative">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${f.border} bg-white/5 text-2xl mb-5`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-surface-800/30">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="section-label mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">From post to payout in minutes</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%_-_1rem)] w-8 h-px bg-gradient-to-r from-brand-600/40 to-transparent z-10" />
                )}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-black gradient-text">{s.step}</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Role cards ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Two portals, one platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Built for both sides of the marketplace</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Company card */}
            <div className="glass-card rounded-2xl p-8 border-brand-500/15 border hover:border-brand-500/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/20 text-2xl mb-6">🏢</div>
              <h3 className="text-xl font-bold text-white mb-3">For Companies</h3>
              <ul className="space-y-2.5 text-sm text-slate-400 mb-8">
                {[
                  'Post gigs with urgency levels and pay rates',
                  'See real-time rider acceptance on your board',
                  'Analytics: fill rate, surge, partner callbacks',
                  'Manage multi-platform rider preferences',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-brand-400 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold text-white"
              >
                Start posting gigs →
              </button>
            </div>

            {/* Rider card */}
            <div className="glass-card rounded-2xl p-8 border-emerald-500/15 border hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 text-2xl mb-6">🛵</div>
              <h3 className="text-xl font-bold text-white mb-3">For Riders</h3>
              <ul className="space-y-2.5 text-sm text-slate-400 mb-8">
                {[
                  'See gigs from all platforms in one place',
                  'Instant push when new gigs are available',
                  'KYC verification unlocks premium gigs',
                  'Earnings deposited to UPI wallet instantly',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl text-sm font-bold border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-all"
              >
                Join as a rider →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="glass-card rounded-3xl p-12 border border-brand-500/20 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900/30 to-transparent" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Ready to transform your <span className="gradient-text">gig operations?</span>
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Sign in and experience real-time gig management with instant socket delivery, smart rider matching, and seamless payouts.
              </p>
              <button
                id="cta-get-started"
                onClick={() => navigate('/login')}
                className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold text-white"
              >
                Get started — it's free
                <span>→</span>
              </button>
              <p className="mt-4 text-xs text-slate-600">
                Demo accounts available · No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800">
              <span className="text-xs font-black text-white">G</span>
            </div>
            <span className="text-sm font-semibold text-slate-400">GigWorforce</span>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} GigWorforce. Real-time gig workforce infrastructure.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-brand-500 hover:text-brand-400 transition font-medium"
          >
            Sign in →
          </button>
        </div>
      </footer>
    </div>
  );
}
