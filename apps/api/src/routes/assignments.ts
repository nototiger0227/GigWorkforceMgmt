import { Router } from 'express';
import { AssignmentStatus, GigStatus, Role } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { toGigDto, toAssignmentDto } from '../services/mappers.js';
import { gigInclude, recordStatusChange } from '../services/gig-history.js';
import {
  WS_EVENTS as Events,
  emitToAdmin,
  emitToCompany,
  emitToRider,
  broadcastAnalytics,
} from '../realtime/socket.js';
import { invalidateAnalyticsCache } from '../services/analytics.js';
import { creditRiderPayout } from '../services/payouts.js';
import { notifyPartner } from '../integrations/partner-adapter.js';
import { notifyUser } from '../services/notifications.js';

export const assignmentsRouter = Router();

assignmentsRouter.use(authenticate);

assignmentsRouter.get('/me/active', requireRole(Role.RIDER), async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
  if (!rider?.currentGigId) {
    res.json({ assignment: null, gig: null });
    return;
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      riderId: rider.id,
      gigId: rider.currentGigId,
      status: { in: [AssignmentStatus.PENDING, AssignmentStatus.ACTIVE] },
    },
    include: { gig: { include: gigInclude } },
  });

  if (!assignment) {
    res.json({ assignment: null, gig: null });
    return;
  }

  res.json({
    assignment: toAssignmentDto(assignment),
    gig: toGigDto(assignment.gig),
  });
});

assignmentsRouter.patch('/:id/start', requireRole(Role.RIDER), async (req, res) => {
  const result = await transitionAssignment(req.params.id as string, req.user!.id, 'start');
  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const { assignment, gig } = result;
  const dto = toGigDto(gig);
  emitToAdmin(Events.GIG_STARTED, { gig: dto, assignment });
  emitToCompany(gig.companyId, Events.GIG_STARTED, { gig: dto, assignment });
  emitToRider(assignment.riderId, Events.GIG_STARTED, { gig: dto, assignment });
  invalidateAnalyticsCache();
  broadcastAnalytics('admin', gig.companyId);

  res.json({ assignment: toAssignmentDto(assignment), gig: dto });
});

assignmentsRouter.patch('/:id/complete', requireRole(Role.RIDER), async (req, res) => {
  const result = await transitionAssignment(req.params.id as string, req.user!.id, 'complete');
  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const { assignment, gig } = result;
  const dto = toGigDto(gig);
  emitToAdmin(Events.GIG_COMPLETED, { gig: dto, assignment });
  emitToCompany(gig.companyId, Events.GIG_COMPLETED, { gig: dto, assignment });
  emitToRider(assignment.riderId, Events.GIG_COMPLETED, { gig: dto, assignment });
  await notifyPartner(gig.partnerSource, gig.id, assignment.riderId, 'completed');
  await notifyUser(req.user!.id, 'Gig completed', `₹${gig.payAmount} added to your wallet`);
  invalidateAnalyticsCache();
  broadcastAnalytics('admin', gig.companyId);

  res.json({ assignment: toAssignmentDto(assignment), gig: dto });
});

assignmentsRouter.patch('/:id/cancel', requireRole(Role.RIDER), async (req, res) => {
  const result = await transitionAssignment(req.params.id as string, req.user!.id, 'cancel');
  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const { assignment, gig } = result;
  const dto = toGigDto(gig);
  emitToAdmin(Events.GIG_UPDATED, { gig: dto, assignment });
  emitToCompany(gig.companyId, Events.GIG_UPDATED, { gig: dto, assignment });
  invalidateAnalyticsCache();
  broadcastAnalytics('admin', gig.companyId);

  res.json({ assignment: toAssignmentDto(assignment), gig: dto });
});

async function transitionAssignment(
  assignmentId: string,
  userId: string,
  action: 'start' | 'complete' | 'cancel',
) {
  const rider = await prisma.rider.findUnique({ where: { userId } });
  if (!rider) return { error: 'Rider not found', status: 404 };

  const existing = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { gig: true },
  });

  if (!existing || existing.riderId !== rider.id) {
    return { error: 'Assignment not found', status: 404 };
  }

  if (action === 'start') {
    if (existing.status !== AssignmentStatus.PENDING) {
      return { error: 'Assignment cannot be started', status: 400 };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.ACTIVE, startedAt: new Date() },
      });

      const gig = await tx.gig.update({
        where: { id: existing.gigId },
        data: { status: GigStatus.IN_PROGRESS },
        include: gigInclude,
      });

      await recordStatusChange(existing.gigId, GigStatus.IN_PROGRESS, userId, existing.gig.status, 'Rider started', tx);

      return { assignment, gig };
    });

    return updated;
  }

  if (action === 'complete') {
    if (existing.status !== AssignmentStatus.ACTIVE) {
      return { error: 'Assignment must be active to complete', status: 400 };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.COMPLETED, completedAt: new Date() },
      });

      const gig = await tx.gig.update({
        where: { id: existing.gigId },
        data: { status: GigStatus.COMPLETED },
        include: gigInclude,
      });

      await tx.rider.update({
        where: { id: rider.id },
        data: { currentGigId: null },
      });

      await creditRiderPayout(rider.id, assignment.id, Number(gig.payAmount), tx);
      await recordStatusChange(existing.gigId, GigStatus.COMPLETED, userId, GigStatus.IN_PROGRESS, 'Rider completed', tx);

      return { assignment, gig };
    });

    return updated;
  }

  // cancel — reopen gig
  if (![AssignmentStatus.PENDING as string, AssignmentStatus.ACTIVE as string].includes(existing.status)) {
    return { error: 'Assignment cannot be cancelled', status: 400 };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.update({
      where: { id: assignmentId },
      data: { status: AssignmentStatus.CANCELLED, cancelledAt: new Date() },
    });

    const remaining = await tx.assignment.count({
      where: { gigId: existing.gigId, status: { in: [AssignmentStatus.PENDING, AssignmentStatus.ACTIVE] } },
    });

    const newGigStatus = remaining > 0 ? GigStatus.ASSIGNED : GigStatus.OPEN;

    const gig = await tx.gig.update({
      where: { id: existing.gigId },
      data: { status: newGigStatus },
      include: gigInclude,
    });

    await tx.rider.update({
      where: { id: rider.id },
      data: { currentGigId: null },
    });

    await recordStatusChange(existing.gigId, newGigStatus, userId, existing.gig.status, 'Rider cancelled — gig reopened', tx);

    return { assignment, gig };
  });

  return updated;
}
