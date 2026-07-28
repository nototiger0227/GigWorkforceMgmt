import type { AuthUser, GigDto, AssignmentDto, PayoutDto } from '@gig/shared';
import type { Gig, Assignment, Company, Zone, Rider, User, Payout } from '@prisma/client';

type GigWithRelations = Gig & {
  company?: Pick<Company, 'name'>;
  zone?: Pick<Zone, 'centerLat' | 'centerLng' | 'radiusKm'> | null;
  assignments?: (Assignment & { rider?: Rider & { user?: Pick<User, 'email'> } })[];
};

export function toAuthUser(user: User & { company?: { id: string } | null; rider?: { id: string } | null }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId ?? user.company?.id,
    riderId: user.rider?.id,
  };
}

export function toGigDto(gig: GigWithRelations): GigDto {
  return {
    id: gig.id,
    companyId: gig.companyId,
    companyName: gig.company?.name,
    zoneId: gig.zoneId,
    title: gig.title,
    description: gig.description,
    pickupZone: gig.pickupZone,
    serviceArea: gig.serviceArea,
    pickupLat: gig.pickupLat,
    pickupLng: gig.pickupLng,
    requiredRiders: gig.requiredRiders,
    basePayAmount: gig.basePayAmount.toString(),
    surgeMultiplier: gig.surgeMultiplier.toString(),
    payAmount: gig.payAmount.toString(),
    currency: gig.currency,
    urgency: gig.urgency,
    status: gig.status,
    partnerSource: gig.partnerSource,
    externalId: gig.externalId,
    preferPlatformTags: gig.preferPlatformTags ?? [],
    startsAt: gig.startsAt.toISOString(),
    expiresAt: gig.expiresAt.toISOString(),
    createdAt: gig.createdAt.toISOString(),
    updatedAt: gig.updatedAt.toISOString(),
    assignments: gig.assignments?.map(toAssignmentDto),
  };
}

export function toAssignmentDto(a: Assignment & { rider?: Rider & { user?: Pick<User, 'email'> } }): AssignmentDto {
  return {
    id: a.id,
    gigId: a.gigId,
    riderId: a.riderId,
    riderName: a.rider?.user?.email,
    status: a.status,
    acceptedAt: a.acceptedAt.toISOString(),
    startedAt: a.startedAt?.toISOString() ?? null,
    completedAt: a.completedAt?.toISOString() ?? null,
  };
}

export function toPayoutDto(p: Payout): PayoutDto {
  return {
    id: p.id,
    riderId: p.riderId,
    assignmentId: p.assignmentId,
    amount: p.amount.toString(),
    status: p.status as any,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
  };
}

export function toCompanyDto(company: Company & { zones?: Zone[] }) {
  return {
    id: company.id,
    name: company.name,
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone,
    zones: (company.zones ?? []).map((z) => ({
      id: z.id,
      name: z.name,
      city: z.city,
      companyId: z.companyId,
      centerLat: z.centerLat,
      centerLng: z.centerLng,
      radiusKm: z.radiusKm,
    })),
  };
}

export function toRiderDto(rider: Rider & { user: Pick<User, 'email'> }) {
  return {
    id: rider.id,
    userId: rider.userId,
    email: rider.user.email,
    isOnline: rider.isOnline,
    isVerified: rider.isVerified,
    platformTags: rider.platformTags,
    currentGigId: rider.currentGigId,
    walletBalance: rider.walletBalance.toString(),
    lastLat: rider.lastLat,
    lastLng: rider.lastLng,
  };
}
