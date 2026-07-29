import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalyticsOverview, GigDto } from '@gig/shared';
import { Urgency } from '@gig/shared';
import { api } from '../lib/api';
import { useSocket } from '../lib/socket';
import { AppShell } from '../components/Layout';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { GigCard } from '../components/GigCard';
import { Button, Card, EmptyState, FormField, Input, SectionHeader, Select, Toast } from '../components/ui';

export function CompanyPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    pickupZone: '',
    serviceArea: '',
    payAmount: 400,
    urgency: Urgency.MEDIUM as Urgency,
    requiredRiders: 1,
    startsAt: '',
    expiresAt: '',
    preferPlatformTags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const onEvent = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['company-gigs'] });
    qc.invalidateQueries({ queryKey: ['company-analytics'] });
  }, [qc]);

  useSocket(onEvent);

  const { data: overview } = useQuery({
    queryKey: ['company-analytics'],
    queryFn: () => api<{ overview: AnalyticsOverview }>('/analytics/overview?scope=company').then((r) => r.overview),
    refetchInterval: 30000,
  });

  const { data: gigs = [], isLoading } = useQuery({
    queryKey: ['company-gigs'],
    queryFn: () => api<{ gigs: GigDto[] }>('/gigs').then((r) => r.gigs),
  });

  async function postGig(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setIsSubmitting(true);
    const payload: Record<string, unknown> = {
      ...form,
      payAmount: Number(form.payAmount),
      requiredRiders: Number(form.requiredRiders),
      preferPlatformTags: form.preferPlatformTags
        ? form.preferPlatformTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };
    if (!form.startsAt) delete payload.startsAt;
    if (!form.expiresAt) delete payload.expiresAt;

    try {
      await api('/gigs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setToast('Gig posted — riders notified in real time');
      setShowForm(false);
      setForm({ ...form, title: '', description: '' });
      qc.invalidateQueries({ queryKey: ['company-gigs'] });
      qc.invalidateQueries({ queryKey: ['company-analytics'] });
    } catch (err: any) {
      if (err.details) {
        setFieldErrors(err.details);
      } else {
        setToast(err.message || 'Failed to post gig');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelGig(id: string) {
    await api(`/gigs/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({}) });
    setToast('Gig cancelled');
    qc.invalidateQueries({ queryKey: ['company-gigs'] });
  }

  const criticalOpen = gigs.filter((g) => g.status === 'OPEN' && g.urgency === Urgency.CRITICAL).length;

  return (
    <AppShell title="Company Operations">
      {toast && <div className="mb-4"><Toast message={toast} type="info" onClose={() => setToast('')} /></div>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          {criticalOpen > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-300">
              ⚠️ {criticalOpen} critical gig{criticalOpen > 1 ? 's' : ''} unfilled
            </span>
          )}
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '× Close' : '+ Post Gig'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h3 className="text-sm font-bold text-white mb-4">New Gig Details</h3>
          <form onSubmit={postGig} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField label="Job Title" error={fieldErrors.title?.[0]}>
                <Input placeholder="e.g. Express Delivery — Koramangala" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </FormField>
            </div>
            <div className="md:col-span-2">
              <FormField label="Description (optional)" error={fieldErrors.description?.[0]}>
                <Input placeholder="Any special instructions for riders" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Pickup Zone" error={fieldErrors.pickupZone?.[0]}>
              <Input placeholder="e.g. Indiranagar" value={form.pickupZone} onChange={(e) => setForm({ ...form, pickupZone: e.target.value })} required />
            </FormField>
            <FormField label="Service Area" error={fieldErrors.serviceArea?.[0]}>
              <Input placeholder="e.g. HSR Layout" value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} required />
            </FormField>
            <FormField label="Pay Amount (INR)" error={fieldErrors.payAmount?.[0]}>
              <Input type="number" value={form.payAmount} onChange={(e) => setForm({ ...form, payAmount: Number(e.target.value) })} required />
            </FormField>
            <FormField label="Urgency" error={fieldErrors.urgency?.[0]}>
              <Select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as Urgency })}>
                {Object.values(Urgency).map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </FormField>
            <FormField label="Starts At" error={fieldErrors.startsAt?.[0]}>
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </FormField>
            <FormField label="Expires At" error={fieldErrors.expiresAt?.[0]}>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Prefer Platform Tags" hint="Comma-separated, e.g. swiggy,zomato" error={fieldErrors.preferPlatformTags?.[0]}>
                <Input value={form.preferPlatformTags} onChange={(e) => setForm({ ...form, preferPlatformTags: e.target.value })} placeholder="swiggy, zomato" />
              </FormField>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" isLoading={isSubmitting}>Publish Gig →</Button>
            </div>
          </form>
        </Card>
      )}

      <AnalyticsPanel overview={overview} />

      <section className="mt-8">
        <SectionHeader
          label="Company gigs"
          title="Your Posted Gigs"
          action={
            <span className="text-xs text-slate-500">{gigs.length} total</span>
          }
        />
        {isLoading ? (
          <div className="flex items-center gap-3 py-8 text-slate-400">
            <div className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <span>Loading…</span>
          </div>
        ) : gigs.length === 0 ? (
          <EmptyState icon="📦" title="No gigs posted" description="Post your first urgent gig to get riders on the board." />
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
