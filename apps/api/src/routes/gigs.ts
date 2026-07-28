import { Router } from 'express';
import { createGigSchema } from '@gig/shared';
import { GigStatus, Role } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole, validateBody } from '../middleware/auth.js';
import { toGigDto } from '../services/mappers.js';
import { gigInclude, recordStatusChange } from '../services/gig-history.js';
import { createGig } from '../services/create-gig.js';
import { isWithinRadius, DEFAULT_MATCH_RADIUS_KM } from '../services/geo.js';
import { sortGigsByMatch } from '../services/matching.js';
import { notifyPartner } from '../integrations/partner-adapter.js';
import { notifyUser, notifyCompanyUsers } from '../services/notifications.js';
import {
  WS_EVENTS as Events,
  emitToAdmin,
  emitToCompany,
  emitToRider,
  emitToRiders,
  emitToZone,
  broadcastAnalytics,
} from '../realtime/socket.js';
import { invalidateAnalyticsCache } from '../services/analytics.js';

export const gigsRouter = Router();

gigsRouter.use(authenticate);

gigsRouter.get('/', async (req, res) => {
  const user = req.user!;
  const status = req.query.status as string | undefined;

  let where: Record<string, unknown> = {};

  if (user.role === Role.COMPANY && user.companyId) {
    where.companyId = user.companyId;
  } else if (user.role === Role.RIDER) {
    where.status = GigStatus.OPEN;
    where.expiresAt = { gt: new Date() };
  }

  if (status) where.status = status;

  let gigs = await prisma.gig.findMany({
    where,
    include: { ...gigInclude, zone: { select: { centerLat: true, centerLng: true, radiusKm: true } } },
    orderBy: [{ urgency: 'desc' }, { payAmount: 'desc' }, { startsAt: 'asc' }],
  });

  if (user.role === Role.RIDER) {
    const rider = await prisma.rider.findUnique({ where: { userId: user.id } });
    if (rider) {
      const scored = sortGigsByMatch(gigs, rider);
      return res.json({
        gigs: scored.map((g) => ({ ...toGigDto(g), matchScore: g.matchScore })),
      });
    }
  }

  res.json({ gigs: gigs.map(toGigDto) });
});

gigsRouter.get('/:id', async (req, res) => {
  const gig = await prisma.gig.findUnique({
    where: { id: req.params.id },
    include: { ...gigInclude, history: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });

  if (!gig) {
    res.status(404).json({ error: 'Gig not found' });
    return;
  }

  if (req.user!.role === Role.COMPANY && gig.companyId !== req.user!.companyId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json({ gig: toGigDto(gig) });
});

gigsRouter.post('/', requireRole(Role.COMPANY), validateBody(createGigSchema), async (req, res) => {
  const companyId = req.user!.companyId;
  if (!companyId) {
    res.status(400).json({ error: 'Company profile required' });
    return;
  }

  const gig = await createGig({ ...req.body, companyId, changedById: req.user!.id });
  res.status(201).json({ gig: toGigDto(gig) });
});

gigsRouter.patch('/:id/cancel', async (req, res) => {
  const user = req.user!;
  const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });

  if (!gig) {
    res.status(404).json({ error: 'Gig not found' });
    return;
  }

  const canCancel =
    user.role === Role.ADMIN || (user.role === Role.COMPANY && gig.companyId === user.companyId);

  if (!canCancel) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  if ([GigStatus.COMPLETED as string, GigStatus.CANCELLED as string].includes(gig.status)) {
    res.status(400).json({ error: `Cannot cancel gig in ${gig.status} status` });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const g = await tx.gig.update({
      where: { id: gig.id },
      data: { status: GigStatus.CANCELLED },
      include: gigInclude,
    });

    await tx.assignment.updateMany({
      where: { gigId: gig.id, status: { in: ['PENDING', 'ACTIVE'] } },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await tx.rider.updateMany({
      where: { currentGigId: gig.id },
      data: { currentGigId: null },
    });

    await recordStatusChange(gig.id, GigStatus.CANCELLED, user.id, gig.status, req.body.reason, tx);
    return g;
  });

  const dto = toGigDto(updated);
  emitToAdmin(Events.GIG_CANCELLED, dto);
  emitToCompany(gig.companyId, Events.GIG_CANCELLED, dto);
  emitToRiders(Events.GIG_CANCELLED, dto);
  invalidateAnalyticsCache();
  broadcastAnalytics('admin', gig.companyId);

  res.json({ gig: dto });
});

gigsRouter.post('/:id/accept', requireRole(Role.RIDER), async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
  if (!rider) {
    res.status(404).json({ error: 'Rider profile not found' });
    return;
  }

  if (!rider.isOnline) {
    res.status(400).json({ error: 'You must be online to accept gigs' });
    return;
  }

  if (rider.currentGigId) {
    res.status(400).json({ error: 'You already have an active gig' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const gigs = await tx.$queryRaw<{ id: string; status: string; required_riders: number; partner_source: string | null; urgency: string }[]>`
        SELECT id, status, "requiredRiders" as required_riders, "partnerSource" as partner_source, urgency::text as urgency
        FROM "Gig"
        WHERE id = ${req.params.id}
        FOR UPDATE
      `;

      const locked = gigs[0];
      if (!locked || locked.status !== GigStatus.OPEN) throw new Error('GIG_NOT_AVAILABLE');

      if (locked.urgency === 'CRITICAL' && !rider.isVerified) throw new Error('KYC_REQUIRED');

      const activeCount = await tx.assignment.count({
        where: { gigId: locked.id, status: { in: ['PENDING', 'ACTIVE'] } },
      });

      if (activeCount >= locked.required_riders) throw new Error('GIG_FULL');

      const assignment = await tx.assignment.create({
        data: { gigId: locked.id, riderId: rider.id, status: 'PENDING' },
      });

      const newStatus = activeCount + 1 >= locked.required_riders ? GigStatus.ASSIGNED : GigStatus.OPEN;

      const gig = await tx.gig.update({
        where: { id: locked.id },
        data: { status: newStatus },
        include: gigInclude,
      });

      await tx.rider.update({ where: { id: rider.id }, data: { currentGigId: locked.id } });
      await recordStatusChange(locked.id, newStatus, req.user!.id, GigStatus.OPEN, 'Rider accepted', tx);

      return { gig, assignment, partnerSource: locked.partner_source };
    });

    const dto = toGigDto(result.gig);
    emitToAdmin(Events.GIG_ASSIGNED, { gig: dto, assignment: result.assignment });
    emitToCompany(result.gig.companyId, Events.GIG_ASSIGNED, { gig: dto, assignment: result.assignment });
    emitToRider(rider.id, Events.GIG_ASSIGNED, { gig: dto, assignment: result.assignment });
    emitToRiders(Events.GIG_UPDATED, dto);
    if (result.gig.zoneId) emitToZone(result.gig.zoneId, Events.GIG_UPDATED, dto);
    await notifyPartner(result.partnerSource, result.gig.id, rider.id, 'assigned');
    await notifyUser(req.user!.id, 'Gig accepted', `You accepted: ${result.gig.title}`);
    await notifyCompanyUsers(result.gig.companyId, 'Rider assigned', `${result.gig.title} was accepted`);
    invalidateAnalyticsCache();
    broadcastAnalytics('admin', result.gig.companyId);

    res.json({ gig: dto, assignment: result.assignment });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Accept failed';
    if (message === 'GIG_NOT_AVAILABLE') return void res.status(409).json({ error: 'Gig is no longer available' });
    if (message === 'GIG_FULL') return void res.status(409).json({ error: 'Gig is already fully assigned' });
    if (message === 'KYC_REQUIRED') return void res.status(403).json({ error: 'KYC verification required for critical gigs' });
    throw err;
  }
});
