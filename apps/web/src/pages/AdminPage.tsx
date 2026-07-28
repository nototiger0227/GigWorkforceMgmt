import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalyticsOverview, CompanyDto, GigDto, OpsMapData, RiderDto } from '@gig/shared';
import { api } from '../lib/api';
import { useSocket } from '../lib/socket';
import { AppShell } from '../components/Layout';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { OpsMap } from '../components/OpsMap';
import { GigCard } from '../components/GigCard';
import { Button, Card, EmptyState, Input, SectionHeader, StatCard, Toast } from '../components/ui';

export function AdminPage() {
  const qc = useQueryClient();
  const [companyName, setCompanyName] = useState('');
  const [toast, setToast] = useState('');

  const onEvent = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin-gigs'] });
    qc.invalidateQueries({ queryKey: ['admin-analytics'] });
    qc.invalidateQueries({ queryKey: ['admin-companies'] });
    qc.invalidateQueries({ queryKey: ['admin-riders'] });
    qc.invalidateQueries({ queryKey: ['admin-kyc'] });
    qc.invalidateQueries({ queryKey: ['admin-deliveries'] });
  }, [qc]);

  useSocket(onEvent);

  const { data: overview } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api<{ overview: AnalyticsOverview }>('/analytics/overview?scope=admin').then((r) => r.overview),
    refetchInterval: 30000,
  });

  const { data: gigs = [] } = useQuery({
    queryKey: ['admin-gigs'],
    queryFn: () => api<{ gigs: GigDto[] }>('/gigs').then((r) => r.gigs),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => api<{ companies: CompanyDto[] }>('/companies').then((r) => r.companies),
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['admin-riders'],
    queryFn: () => api<{ riders: RiderDto[] }>('/riders').then((r) => r.riders),
  });

  async function createCompany() {
    if (!companyName.trim()) return;
    await api('/companies', { method: 'POST', body: JSON.stringify({ name: companyName }) });
    setCompanyName('');
    setToast('Company created');
    qc.invalidateQueries({ queryKey: ['admin-companies'] });
  }

  async function cancelGig(id: string) {
    await api(`/gigs/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason: 'Admin override' }) });
    setToast('Gig cancelled');
    qc.invalidateQueries({ queryKey: ['admin-gigs'] });
  }

  const { data: payouts = [] } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => api<{ payouts: { id: string; riderEmail: string; amount: string; status: string }[] }>('/payouts').then((r) => r.payouts),
  });

  const { data: kycQueue = [] } = useQuery({
    queryKey: ['admin-kyc'],
    queryFn: () => api<{ submissions: { id: string; riderEmail: string; documentType: string; documentNumber: string }[] }>('/kyc/pending').then((r) => r.submissions),
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: () => api<{ deliveries: { id: string; partner: string; event: string; status: string; attempts: number; lastError: string | null }[] }>('/integrations/deliveries').then((r) => r.deliveries),
    refetchInterval: 30000,
  });

  const { data: opsMap } = useQuery({
    queryKey: ['admin-ops-map'],
    queryFn: () => api<{ map: OpsMapData }>('/ops/map').then((r) => r.map),
    refetchInterval: 15000,
  });

  async function reviewKyc(id: string, approved: boolean) {
    await api(`/kyc/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ approved, reviewNote: approved ? 'Approved' : 'Rejected' }),
    });
    qc.invalidateQueries({ queryKey: ['admin-kyc'] });
    qc.invalidateQueries({ queryKey: ['admin-riders'] });
    setToast(approved ? 'Rider verified' : 'KYC rejected');
  }

  async function markPaid(id: string) {
    await api(`/payouts/${id}/paid`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['admin-payouts'] });
    setToast('Payout marked paid');
  }

  async function toggleVerify(rider: RiderDto) {
    await api(`/riders/${rider.id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified: !rider.isVerified }),
    });
    qc.invalidateQueries({ queryKey: ['admin-riders'] });
  }

  return (
    <AppShell title="Admin Dashboard">
      {toast && (
        <div className="mb-4"><Toast message={toast} type="info" onClose={() => setToast('')} /></div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Gigs" value={gigs.length} sub="all time" icon="💼" color="brand" />
        <StatCard label="Active Riders" value={riders.filter(r => r.isOnline).length} sub={`of ${riders.length} total`} icon="🛥" color="emerald" />
        <StatCard label="Companies" value={companies.length} sub="onboarded" icon="🏢" color="brand" />
        <StatCard label="KYC Pending" value={kycQueue.length} sub="awaiting review" icon="🛡️" color={kycQueue.length > 0 ? 'amber' : 'emerald'} />
      </div>

      <AnalyticsPanel overview={overview} />

      <section className="mt-8">
        <SectionHeader label="Geospatial" title="Live Ops Map" />
        <OpsMap data={opsMap} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader label="Management" title="Companies" />
          <div className="mb-4 flex gap-2">
            <Input placeholder="New company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Button onClick={createCompany}>Add</Button>
          </div>
          <ul className="space-y-2 text-sm">
            {companies.map((c) => (
              <li key={c.id} className="flex justify-between rounded-xl bg-white/4 border border-white/5 px-3 py-2.5">
                <span className="font-medium text-slate-200">{c.name}</span>
                <span className="text-slate-500">{c.zones.length} zones</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionHeader label="Workforce" title="Riders" />
          <ul className="space-y-2 text-sm">
            {riders.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl bg-white/4 border border-white/5 px-3 py-2.5">
                <div>
                  <p className="font-medium text-slate-200">{r.email}</p>
                  <p className="text-xs text-slate-500">{r.platformTags.join(', ') || 'no tags'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={r.isOnline ? 'text-emerald-400 text-xs font-medium' : 'text-slate-500 text-xs'}>{r.isOnline ? 'Online' : 'Offline'}</span>
                  <Button variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => toggleVerify(r)}>
                    {r.isVerified ? '✓ Verified' : 'Verify'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-white">KYC review queue</h2>
          {kycQueue.length === 0 ? (
            <p className="text-sm text-slate-500">No pending submissions.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {kycQueue.map((k) => (
                <li key={k.id} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2">
                  <div>
                    <p>{k.riderEmail}</p>
                    <p className="text-xs text-slate-500">{k.documentType}: {k.documentNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => reviewKyc(k.id, true)}>Approve</Button>
                    <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => reviewKyc(k.id, false)}>Reject</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-white">Partner callbacks</h2>
          {deliveries.length === 0 ? (
            <p className="text-sm text-slate-500">No outbound deliveries yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {deliveries.slice(0, 8).map((d) => (
                <li key={d.id} className="rounded-lg bg-slate-950 px-3 py-2">
                  <div className="flex justify-between">
                    <span>{d.partner} · {d.event}</span>
                    <span className={d.status === 'SUCCESS' ? 'text-emerald-400' : d.status === 'FAILED' ? 'text-red-400' : 'text-amber-400'}>{d.status}</span>
                  </div>
                  {d.lastError && <p className="mt-1 text-xs text-slate-500">{d.lastError}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Payouts</h2>
        <Card>
          {payouts.length === 0 ? (
            <p className="text-sm text-slate-500">No payouts yet — created when riders complete gigs.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {payouts.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2">
                  <span>{p.riderEmail} · ₹{p.amount}</span>
                  <div className="flex items-center gap-2">
                    <span className={p.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}>{p.status}</span>
                    {p.status === 'PENDING' && (
                      <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => markPaid(p.id)}>Mark paid</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">All gigs</h2>
        {gigs.length === 0 ? (
          <EmptyState title="No gigs yet" description="Companies will post gigs here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} showActions="company" onCancel={() => cancelGig(g.id)} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
