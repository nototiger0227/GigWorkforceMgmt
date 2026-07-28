import type { AnalyticsOverview } from '@gig/shared';
import { Card } from './ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function AnalyticsPanel({ overview, loading }: { overview?: AnalyticsOverview; loading?: boolean }) {
  if (loading || !overview) {
    return <Card><p className="text-slate-400">Loading analytics…</p></Card>;
  }

  const kpis = [
    { label: 'Open gigs', value: overview.openGigs },
    { label: 'Unfilled (past start)', value: overview.unfilledGigs },
    { label: 'Avg time to fill', value: `${overview.avgTimeToFillMinutes}m` },
    { label: 'Online riders', value: overview.activeOnlineRiders },
    { label: 'Fill rate (24h)', value: `${overview.fillRatePercent}%` },
    { label: 'Critical shortage', value: overview.criticalShortageCount },
  ];

  const chartData = overview.hourlyStats.map((h) => ({
    hour: h.hour.slice(11, 16),
    posted: h.posted,
    filled: h.filled,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="!p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{k.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-medium text-slate-300">Gigs posted vs filled (24h)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              <Bar dataKey="posted" fill="#3b82f6" name="Posted" radius={[4, 4, 0, 0]} />
              <Bar dataKey="filled" fill="#10b981" name="Filled" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {overview.shortageByZone.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-medium text-slate-300">Shortage by zone</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-500">
                  <th className="pb-2 pr-4">Zone</th>
                  <th className="pb-2 pr-4">City</th>
                  <th className="pb-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {overview.shortageByZone.map((z, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-2 pr-4 text-slate-200">{z.zoneName}</td>
                    <td className="py-2 pr-4 text-slate-400">{z.city}</td>
                    <td className="py-2 text-amber-400">{z.openCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
