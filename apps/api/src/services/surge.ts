import { prisma } from '../lib/prisma.js';

/** Surge from open-gig vs online-rider ratio in a zone. */
export async function computeSurgeMultiplier(zoneId?: string | null): Promise<number> {
  const openGigs = await prisma.gig.count({
    where: { status: 'OPEN', ...(zoneId ? { zoneId } : {}) },
  });
  const onlineRiders = await prisma.rider.count({ where: { isOnline: true } });
  if (onlineRiders === 0) return openGigs >= 3 ? 1.5 : 1;

  const ratio = openGigs / onlineRiders;
  if (ratio >= 2) return 2;
  if (ratio >= 1) return 1.5;
  if (ratio >= 0.5) return 1.25;
  return 1;
}

export function applySurge(basePay: number, multiplier: number): number {
  return Math.round(basePay * multiplier * 100) / 100;
}
