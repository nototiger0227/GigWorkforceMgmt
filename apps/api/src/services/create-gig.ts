import { GigStatus } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { gigInclude, recordStatusChange } from './gig-history.js';
import { computeSurgeMultiplier, applySurge } from './surge.js';
import { invalidateAnalyticsCache } from './analytics.js';
import {
  WS_EVENTS as Events,
  emitToAdmin,
  emitToCompany,
  emitToRider,
  emitToRiders,
  emitToZone,
  broadcastAnalytics,
} from '../realtime/socket.js';
import { toGigDto } from './mappers.js';

export interface CreateGigInput {
  companyId: string;
  title: string;
  description?: string;
  zoneId?: string;
  pickupZone: string;
  serviceArea: string;
  pickupLat?: number;
  pickupLng?: number;
  requiredRiders?: number;
  payAmount: number;
  currency?: string;
  urgency: string;
  startsAt: Date;
  expiresAt: Date;
  partnerSource?: string;
  externalId?: string;
  preferPlatformTags?: string[];
  changedById?: string;
  reason?: string;
}

export async function createGig(input: CreateGigInput) {
  const surgeMultiplier = await computeSurgeMultiplier(input.zoneId);
  const basePayAmount = input.payAmount;
  const payAmount = applySurge(basePayAmount, surgeMultiplier);

  const now = new Date();
  const startsAt = input.startsAt && !isNaN(new Date(input.startsAt).getTime()) ? new Date(input.startsAt) : now;
  const expiresAt = input.expiresAt && !isNaN(new Date(input.expiresAt).getTime()) ? new Date(input.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const gig = await prisma.gig.create({
    data: {
      companyId: input.companyId,
      title: input.title,
      description: input.description,
      zoneId: input.zoneId,
      pickupZone: input.pickupZone,
      serviceArea: input.serviceArea,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      requiredRiders: input.requiredRiders ?? 1,
      basePayAmount,
      surgeMultiplier,
      payAmount,
      currency: input.currency ?? 'INR',
      urgency: input.urgency as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      status: GigStatus.OPEN,
      partnerSource: input.partnerSource,
      externalId: input.externalId,
      preferPlatformTags: input.preferPlatformTags ?? [],
      startsAt,
      expiresAt,
    },
    include: gigInclude,
  });

  await recordStatusChange(
    gig.id,
    GigStatus.OPEN,
    input.changedById,
    null,
    input.reason ?? (input.partnerSource ? `Ingested from ${input.partnerSource}` : 'Gig posted'),
  );

  const dto = toGigDto(gig);
  emitToAdmin(Events.GIG_CREATED, dto);
  emitToCompany(input.companyId, Events.GIG_CREATED, dto);
  emitToRiders(Events.GIG_CREATED, dto);
  if (gig.zoneId) emitToZone(gig.zoneId, Events.GIG_CREATED, dto);
  invalidateAnalyticsCache();
  broadcastAnalytics('admin', input.companyId);

  return gig;
}
