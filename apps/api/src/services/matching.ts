import type { Urgency } from '@gig/shared';
import { haversineKm } from './geo.js';

const URGENCY_SCORE: Record<Urgency, number> = {
  LOW: 10,
  MEDIUM: 25,
  HIGH: 50,
  CRITICAL: 80,
};

interface ScorableGig {
  payAmount: { toString(): string } | number;
  urgency: Urgency;
  pickupLat: number | null;
  pickupLng: number | null;
  preferPlatformTags: string[];
  zone?: { centerLat: number | null; centerLng: number | null } | null;
}

interface RiderContext {
  lastLat: number | null;
  lastLng: number | null;
  platformTags: string[];
}

export function scoreGigForRider(gig: ScorableGig, rider: RiderContext): number {
  let score = URGENCY_SCORE[gig.urgency] ?? 10;
  score += Math.min(Number(gig.payAmount) / 10, 50);

  if (gig.preferPlatformTags.length > 0) {
    const overlap = gig.preferPlatformTags.filter((t) => rider.platformTags.includes(t));
    score += overlap.length * 15;
  }

  const lat = gig.pickupLat ?? gig.zone?.centerLat;
  const lng = gig.pickupLng ?? gig.zone?.centerLng;

  if (rider.lastLat != null && rider.lastLng != null && lat != null && lng != null) {
    const km = haversineKm(rider.lastLat, rider.lastLng, lat, lng);
    score += Math.max(0, 30 - km * 3);
  }

  return Math.round(score * 10) / 10;
}

export function sortGigsByMatch<T extends ScorableGig>(gigs: T[], rider: RiderContext): (T & { matchScore: number })[] {
  return gigs
    .map((g) => ({ ...g, matchScore: scoreGigForRider(g, rider) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
