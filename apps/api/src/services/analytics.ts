import type { AnalyticsOverview } from '@gig/shared';
import { GigStatus, Urgency } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { cacheGet, cacheSet, cacheInvalidateAll } from '../lib/redis.js';

const CACHE_TTL_SEC = 30;

export async function getAnalyticsOverview(scope: 'admin' | 'company', companyId?: string): Promise<AnalyticsOverview> {
  const cacheKey = `${scope}:${companyId ?? 'all'}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached) as AnalyticsOverview;

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const gigWhere = companyId ? { companyId } : {};

  const [
    openGigs,
    unfilledGigs,
    criticalShortageCount,
    activeOnlineRiders,
    postedLast24h,
    filledLast24h,
    assignmentsWithAccept,
    openGigsForZone,
    hourlyGigs,
  ] = await Promise.all([
    prisma.gig.count({ where: { ...gigWhere, status: GigStatus.OPEN } }),
    prisma.gig.count({ where: { ...gigWhere, status: GigStatus.OPEN, startsAt: { lt: now } } }),
    prisma.gig.count({
      where: { ...gigWhere, status: GigStatus.OPEN, urgency: { in: [Urgency.HIGH, Urgency.CRITICAL] } },
    }),
    prisma.rider.count({ where: { isOnline: true } }),
    prisma.gig.count({ where: { ...gigWhere, createdAt: { gte: last24h } } }),
    prisma.gig.count({
      where: {
        ...gigWhere,
        status: { in: [GigStatus.ASSIGNED, GigStatus.IN_PROGRESS, GigStatus.COMPLETED] },
        updatedAt: { gte: last24h },
      },
    }),
    prisma.assignment.findMany({
      where: { acceptedAt: { gte: last24h }, gig: companyId ? { companyId } : undefined },
      include: { gig: { select: { createdAt: true } } },
    }),
    prisma.gig.findMany({
      where: { ...gigWhere, status: GigStatus.OPEN },
      select: { zoneId: true, pickupZone: true, serviceArea: true, urgency: true },
    }),
    prisma.gig.findMany({
      where: { ...gigWhere, createdAt: { gte: last24h } },
      select: { createdAt: true, status: true, updatedAt: true },
    }),
  ]);

  const fillTimes = assignmentsWithAccept
    .map((a) => (a.acceptedAt.getTime() - a.gig.createdAt.getTime()) / 60000)
    .filter((m) => m >= 0);

  const avgTimeToFillMinutes =
    fillTimes.length > 0 ? Math.round(fillTimes.reduce((s, v) => s + v, 0) / fillTimes.length) : 0;

  const fillRatePercent = postedLast24h > 0 ? Math.round((filledLast24h / postedLast24h) * 100) : 0;
  const hourlyStats = buildHourlyStats(hourlyGigs, last24h);

  const zoneIds = [...new Set(openGigsForZone.map((g) => g.zoneId).filter(Boolean))] as string[];
  const zones = zoneIds.length ? await prisma.zone.findMany({ where: { id: { in: zoneIds } } }) : [];
  const zoneMap = new Map(zones.map((z) => [z.id, z]));

  const grouped = new Map<string, { zoneName: string; city: string; openCount: number; criticalCount: number }>();
  for (const g of openGigsForZone) {
    const zone = g.zoneId ? zoneMap.get(g.zoneId) : null;
    const key = g.zoneId ?? `${g.pickupZone}:${g.serviceArea}`;
    const entry = grouped.get(key) ?? {
      zoneName: zone?.name ?? g.pickupZone,
      city: zone?.city ?? g.serviceArea,
      openCount: 0,
      criticalCount: 0,
    };
    entry.openCount++;
    if (g.urgency === Urgency.HIGH || g.urgency === Urgency.CRITICAL) entry.criticalCount++;
    grouped.set(key, entry);
  }

  const data: AnalyticsOverview = {
    openGigs,
    unfilledGigs,
    avgTimeToFillMinutes,
    activeOnlineRiders,
    fillRatePercent,
    criticalShortageCount,
    gigsPostedLast24h: postedLast24h,
    gigsFilledLast24h: filledLast24h,
    hourlyStats,
    shortageByZone: [...grouped.values()],
  };

  await cacheSet(cacheKey, JSON.stringify(data), CACHE_TTL_SEC);
  return data;
}

function buildHourlyStats(
  gigs: { createdAt: Date; status: GigStatus; updatedAt: Date }[],
  since: Date,
): AnalyticsOverview['hourlyStats'] {
  const buckets: Record<string, { posted: number; filled: number }> = {};

  for (let i = 0; i < 24; i++) {
    const hourStart = new Date(since.getTime() + i * 60 * 60 * 1000);
    buckets[hourStart.toISOString().slice(0, 13) + ':00'] = { posted: 0, filled: 0 };
  }

  for (const gig of gigs) {
    const postKey = gig.createdAt.toISOString().slice(0, 13) + ':00';
    if (buckets[postKey]) buckets[postKey].posted++;

    if ([GigStatus.ASSIGNED as string, GigStatus.IN_PROGRESS as string, GigStatus.COMPLETED as string].includes(gig.status)) {
      const fillKey = gig.updatedAt.toISOString().slice(0, 13) + ':00';
      if (buckets[fillKey]) buckets[fillKey].filled++;
    }
  }

  return Object.entries(buckets).map(([hour, stats]) => ({ hour, ...stats }));
}

export function invalidateAnalyticsCache(): void {
  cacheInvalidateAll().catch((err) => console.error('Cache invalidate failed:', err.message));
}
