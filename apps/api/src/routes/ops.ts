import { Router } from 'express';
import { dispatchSchema } from '@gig/shared';
import { GigStatus, Role } from '@gig/shared';
import type { OpsMapData } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole, validateBody } from '../middleware/auth.js';
import { gigInclude, recordStatusChange } from '../services/gig-history.js';
import { notifyPartner } from '../integrations/partner-adapter.js';
import { notifyUser } from '../services/notifications.js';
import { toGigDto } from '../services/mappers.js';
import {
  WS_EVENTS as Events,
  emitToAdmin,
  emitToCompany,
  emitToRider,
  broadcastAnalytics,
} from '../realtime/socket.js';
import { invalidateAnalyticsCache } from '../services/analytics.js';

export const opsRouter = Router();

opsRouter.use(authenticate);

opsRouter.get('/map', requireRole(Role.ADMIN, Role.COMPANY), async (req, res) => {
  const companyId = req.user!.role === Role.COMPANY ? req.user!.companyId : undefined;

  const [riders, openGigs, activeAssignments] = await Promise.all([
    prisma.rider.findMany({
      where: { isOnline: true, lastLat: { not: null }, lastLng: { not: null } },
      include: { user: { select: { email: true } } },
    }),
    prisma.gig.findMany({
      where: {
        status: GigStatus.OPEN,
        ...(companyId ? { companyId } : {}),
      },
    }),
    prisma.assignment.findMany({
      where: {
        status: { in: ['PENDING', 'ACTIVE'] },
        gig: companyId ? { companyId } : undefined,
      },
      include: {
        gig: { select: { id: true, title: true, pickupLat: true, pickupLng: true, status: true } },
        rider: { include: { user: { select: { email: true } } } },
      },
    }),
  ]);

  const data: OpsMapData = {
    riders: riders
      .filter((r) => r.lastLat != null && r.lastLng != null)
      .map((r) => ({
        id: r.id,
        email: r.user.email,
        lat: r.lastLat!,
        lng: r.lastLng!,
        isOnline: r.isOnline,
      })),
    openGigs: openGigs
      .filter((g) => g.pickupLat != null && g.pickupLng != null)
      .map((g) => ({
        id: g.id,
        title: g.title,
        lat: g.pickupLat!,
        lng: g.pickupLng!,
        urgency: g.urgency,
        payAmount: g.payAmount.toString(),
      })),
    active: activeAssignments
      .map((a) => {
        const lat = a.rider.lastLat ?? a.gig.pickupLat;
        const lng = a.rider.lastLng ?? a.gig.pickupLng;
        if (lat == null || lng == null) return null;
        return {
          gigId: a.gig.id,
          gigTitle: a.gig.title,
          riderId: a.riderId,
          riderEmail: a.rider.user.email,
          lat,
          lng,
          status: a.gig.status,
        };
      })
      .filter(Boolean) as OpsMapData['active'],
  };

  res.json({ map: data });
});

opsRouter.post('/dispatch', requireRole(Role.ADMIN), validateBody(dispatchSchema), async (req, res) => {
  const { gigId, riderId } = req.body;

  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider?.isOnline) {
    res.status(400).json({ error: 'Rider must be online' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const gigs = await tx.$queryRaw<{ id: string; status: string; required_riders: number; partner_source: string | null; urgency: string }[]>`
        SELECT id, status, "requiredRiders" as required_riders, "partnerSource" as partner_source, urgency::text as urgency
        FROM "Gig" WHERE id = ${gigId} FOR UPDATE
      `;

      const locked = gigs[0];
      if (!locked || locked.status !== GigStatus.OPEN) throw new Error('GIG_NOT_AVAILABLE');
      if (locked.urgency === 'CRITICAL' && !rider.isVerified) throw new Error('KYC_REQUIRED');

      const activeCount = await tx.assignment.count({
        where: { gigId, status: { in: ['PENDING', 'ACTIVE'] } },
      });
      if (activeCount >= locked.required_riders) throw new Error('GIG_FULL');

      const assignment = await tx.assignment.create({
        data: { gigId, riderId, status: 'PENDING' },
      });

      const newStatus = activeCount + 1 >= locked.required_riders ? GigStatus.ASSIGNED : GigStatus.OPEN;

      const gig = await tx.gig.update({
        where: { id: gigId },
        data: { status: newStatus },
        include: gigInclude,
      });

      await tx.rider.update({ where: { id: riderId }, data: { currentGigId: gigId } });
      await recordStatusChange(gigId, newStatus, req.user!.id, GigStatus.OPEN, 'Admin dispatch', tx);

      return { gig, assignment, partnerSource: locked.partner_source };
    });

    const dto = toGigDto(result.gig);
    emitToAdmin(Events.GIG_ASSIGNED, { gig: dto, assignment: result.assignment });
    emitToCompany(result.gig.companyId, Events.GIG_ASSIGNED, { gig: dto, assignment: result.assignment });
    emitToRider(riderId, Events.GIG_ASSIGNED, { gig: dto, assignment: result.assignment });

    const riderUser = await prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: { select: { id: true } } },
    });
    if (riderUser) {
      await notifyUser(riderUser.user.id, 'Gig assigned', `You were dispatched to: ${result.gig.title}`);
    }

    await notifyPartner(result.partnerSource, result.gig.id, riderId, 'assigned');
    invalidateAnalyticsCache();
    broadcastAnalytics('admin', result.gig.companyId);

    res.json({ gig: dto, assignment: result.assignment });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Dispatch failed';
    if (message === 'GIG_NOT_AVAILABLE') return void res.status(409).json({ error: 'Gig not available' });
    if (message === 'GIG_FULL') return void res.status(409).json({ error: 'Gig is full' });
    if (message === 'KYC_REQUIRED') return void res.status(403).json({ error: 'Rider not verified for critical gig' });
    throw err;
  }
});
