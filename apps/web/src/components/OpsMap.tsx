import type { OpsMapData } from '@gig/shared';
import { Card } from './ui';

function toPercent(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

function computeBounds(points: { lat: number; lng: number }[]) {
  if (points.length === 0) return { minLat: 12.9, maxLat: 12.98, minLng: 77.6, maxLng: 77.65 };
  return {
    minLat: Math.min(...points.map((p) => p.lat)) - 0.01,
    maxLat: Math.max(...points.map((p) => p.lat)) + 0.01,
    minLng: Math.min(...points.map((p) => p.lng)) - 0.01,
    maxLng: Math.max(...points.map((p) => p.lng)) + 0.01,
  };
}

export function OpsMap({ data }: { data?: OpsMapData }) {
  if (!data) return <Card><p className="text-slate-400">Loading map…</p></Card>;

  const points = [
    ...data.riders.map((r) => ({ lat: r.lat, lng: r.lng })),
    ...data.openGigs.map((g) => ({ lat: g.lat, lng: g.lng })),
    ...data.active.map((a) => ({ lat: a.lat, lng: a.lng })),
  ];

  const bounds = computeBounds(points);

  const pos = (lat: number, lng: number) => ({
    left: `${toPercent(lng, bounds.minLng, bounds.maxLng)}%`,
    top: `${100 - toPercent(lat, bounds.minLat, bounds.maxLat)}%`,
  });

  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online riders</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Open gigs</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Active</span>
      </div>
      <div className="relative h-80 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {data.riders.map((r) => (
          <div
            key={r.id}
            title={r.email}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30"
            style={pos(r.lat, r.lng)}
          />
        ))}
        {data.openGigs.map((g) => (
          <div
            key={g.id}
            title={`${g.title} · ₹${g.payAmount}`}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 ring-2 ring-amber-400/30"
            style={pos(g.lat, g.lng)}
          />
        ))}
        {data.active.map((a) => (
          <div
            key={`${a.gigId}-${a.riderId}`}
            title={`${a.riderEmail} · ${a.gigTitle}`}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 ring-2 ring-blue-400/30"
            style={pos(a.lat, a.lng)}
          />
        ))}
        {points.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">No geo data yet</div>
        )}
      </div>
    </Card>
  );
}
