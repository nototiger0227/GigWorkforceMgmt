import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssignmentDto, GigDto, RiderDto } from '@gig/shared';
import { api } from '../lib/api';
import { useSocket } from '../lib/socket';
import { AppShell } from '../components/Layout';
import { GigCard } from '../components/GigCard';
import { Button, Card, EmptyState, Input, Select, SectionHeader, StatCard, StatusBadge, Toast } from '../components/ui';

export function RiderPage() {
  const qc = useQueryClient();
  const [kycType, setKycType] = useState('AADHAAR');
  const [kycNumber, setKycNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const onEvent = useCallback((_event: string) => {
    qc.invalidateQueries({ queryKey: ['rider-gigs'] });
    qc.refetchQueries({ queryKey: ['rider-gigs'] });
    qc.invalidateQueries({ queryKey: ['rider-me'] });
    qc.invalidateQueries({ queryKey: ['rider-active'] });
    qc.refetchQueries({ queryKey: ['rider-active'] });
    if (_event === 'gig:created') {
      setToast('New gig available!');
    }
  }, [qc]);

  useSocket(onEvent);

  const { data: rider } = useQuery({
    queryKey: ['rider-me'],
    queryFn: () => api<{ rider: RiderDto }>('/riders/me').then((r) => r.rider),
  });

  const { data: active } = useQuery({
    queryKey: ['rider-active'],
    queryFn: () => api<{ assignment: AssignmentDto | null; gig: GigDto | null }>('/assignments/me/active'),
  });

  const { data: gigs = [], isLoading } = useQuery({
    queryKey: ['rider-gigs'],
    queryFn: () => api<{ gigs: GigDto[] }>('/gigs').then((r) => r.gigs),
    enabled: !active?.gig,
  });

  const { data: kyc } = useQuery({
    queryKey: ['rider-kyc'],
    queryFn: () => api<{ isVerified: boolean; submissions: { status: string; documentType: string }[] }>('/kyc/me'),
  });

  async function submitKyc(e: React.FormEvent) {
    e.preventDefault();
    await api('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify({ documentType: kycType, documentNumber: kycNumber }),
    });
    setKycNumber('');
    qc.invalidateQueries({ queryKey: ['rider-kyc'] });
    setToast('KYC submitted — awaiting admin review');
  }

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api<{ walletBalance: string }>('/payouts/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(withdrawAmount), upiId }),
      });
      setWithdrawAmount('');
      qc.invalidateQueries({ queryKey: ['rider-payouts'] });
      qc.invalidateQueries({ queryKey: ['rider-me'] });
      setToast(`Withdrawal sent — wallet ₹${res.walletBalance}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    }
  }

  const { data: payouts } = useQuery({
    queryKey: ['rider-payouts'],
    queryFn: () => api<{ walletBalance: string; payouts: { id: string; amount: string; status: string; createdAt: string }[] }>('/payouts/me'),
  });

  async function setLocation(lat: number, lng: number) {
    await api('/riders/me/location', { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
  }

  async function toggleOnline() {
    const goingOnline = !rider?.isOnline;
    if (goingOnline) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        if (!navigator.geolocation) {
          setLocation(12.934, 77.62).then(done);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation(pos.coords.latitude, pos.coords.longitude).then(done),
          () => setLocation(12.934, 77.62).then(done),
        );
      });
    }
    await api('/riders/me/online', {
      method: 'PATCH',
      body: JSON.stringify({ isOnline: goingOnline }),
    });
    qc.invalidateQueries({ queryKey: ['rider-me'] });
    qc.invalidateQueries({ queryKey: ['rider-gigs'] });
    setToast(goingOnline ? 'You are online — showing nearby gigs' : 'You are offline');
  }

  async function acceptGig(id: string) {
    setError('');
    try {
      await api(`/gigs/${id}/accept`, { method: 'POST' });
      setToast('Gig accepted!');
      qc.invalidateQueries({ queryKey: ['rider-active'] });
      qc.invalidateQueries({ queryKey: ['rider-gigs'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed');
    }
  }

  async function startGig() {
    if (!active?.assignment) return;
    await api(`/assignments/${active.assignment.id}/start`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['rider-active'] });
    setToast('Gig started');
  }

  async function completeGig() {
    if (!active?.assignment) return;
    await api(`/assignments/${active.assignment.id}/complete`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['rider-active'] });
    qc.invalidateQueries({ queryKey: ['rider-gigs'] });
    qc.invalidateQueries({ queryKey: ['rider-payouts'] });
    setToast('Gig completed — ₹' + (active.gig?.payAmount ?? '') + ' added to wallet');
  }

  async function cancelGig() {
    if (!active?.assignment) return;
    await api(`/assignments/${active.assignment.id}/cancel`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['rider-active'] });
    qc.invalidateQueries({ queryKey: ['rider-gigs'] });
    setToast('Gig cancelled — returned to board');
  }

  return (
    <AppShell title="Rider Dashboard">
      {toast && <div className="mb-4"><Toast message={toast} onClose={() => setToast('')} /></div>}
      {error && <div className="mb-4"><Toast message={error} type="error" onClose={() => setError('')} /></div>}

      {/* Top stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Wallet Balance"
          value={`₹${payouts?.walletBalance ?? rider?.walletBalance ?? '0'}`}
          sub="Available to withdraw"
          icon="💰"
          color="emerald"
        />
        <StatCard
          label="Status"
          value={rider?.isOnline ? 'Online' : 'Offline'}
          sub={rider?.isOnline ? 'Receiving gigs' : 'Not visible to gigs'}
          icon={rider?.isOnline ? '🟢' : '⚫'}
          color={rider?.isOnline ? 'emerald' : 'brand'}
        />
        <StatCard
          label="KYC"
          value={kyc?.isVerified ? 'Verified' : 'Pending'}
          sub={kyc?.isVerified ? 'All gigs accessible' : 'Submit docs below'}
          icon="🛡️"
          color={kyc?.isVerified ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Platform Tags"
          value={rider?.platformTags.length ?? 0}
          sub={rider?.platformTags.join(', ') || 'No tags set'}
          icon="🔗"
          color="brand"
        />
      </div>

      {/* Online toggle */}
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Availability</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {rider?.isOnline ? 'You are live — gigs are being shown to you in real time.' : 'Go online to start receiving gig opportunities.'}
          </p>
        </div>
        <Button variant={rider?.isOnline ? 'secondary' : 'primary'} onClick={toggleOnline}>
          {rider?.isOnline ? '⏹ Go offline' : '▶ Go online'}
        </Button>
      </Card>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {!kyc?.isVerified && (
          <Card>
            <h2 className="mb-3 font-semibold text-white">KYC verification</h2>
            <p className="mb-3 text-sm text-slate-400">Required for critical gigs and withdrawals.</p>
            <form onSubmit={submitKyc} className="space-y-3">
              <Select value={kycType} onChange={(e) => setKycType(e.target.value)}>
                <option value="AADHAAR">Aadhaar</option>
                <option value="PAN">PAN</option>
                <option value="DRIVING_LICENSE">Driving license</option>
              </Select>
              <Input placeholder="Document number" value={kycNumber} onChange={(e) => setKycNumber(e.target.value)} required />
              <Button type="submit">Submit for review</Button>
            </form>
          </Card>
        )}

        <Card>
          <h2 className="mb-3 font-semibold text-white">Withdraw to UPI</h2>
          <form onSubmit={withdraw} className="space-y-3">
            <Input type="number" placeholder="Amount (INR)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required />
            <Input placeholder="UPI ID (name@upi)" value={upiId} onChange={(e) => setUpiId(e.target.value)} required />
            <Button type="submit" disabled={!kyc?.isVerified}>Withdraw</Button>
            {!kyc?.isVerified && <p className="text-xs text-amber-400">Complete KYC to withdraw</p>}
          </form>
        </Card>
      </div>

      {active?.gig && (
        <Card className="mb-8 border-brand-500/40 bg-brand-950/30">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">Your active gig</h2>
            <StatusBadge status={active.gig.status} />
          </div>
          <GigCard gig={active.gig} />
          <div className="mt-4 flex flex-wrap gap-2">
            {active.gig.status === 'ASSIGNED' && (
              <Button onClick={startGig}>Start gig</Button>
            )}
            {active.gig.status === 'IN_PROGRESS' && (
              <Button onClick={completeGig}>Complete gig</Button>
            )}
            {!['COMPLETED', 'CANCELLED'].includes(active.gig.status) && (
              <Button variant="danger" onClick={cancelGig}>Cancel & release</Button>
            )}
          </div>
        </Card>
      )}

      {!active?.gig && (
        <section>
          <SectionHeader
            label="Live board"
            title="Open Gig Board"
            action={rider?.isOnline && <span className="badge-live">Live</span>}
          />
          {!rider?.isOnline ? (
            <EmptyState icon="📡" title="You're offline" description="Go online to see and accept gigs in real time." />
          ) : isLoading ? (
            <div className="flex items-center gap-3 py-8 text-slate-400">
              <div className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              <span>Loading gigs…</span>
            </div>
          ) : gigs.length === 0 ? (
            <EmptyState icon="🎯" title="No open gigs" description="New gigs appear here instantly when companies post them." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gigs.map((g) => (
                <GigCard key={g.id} gig={g} showActions="rider" onAccept={() => acceptGig(g.id)} />
              ))}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
