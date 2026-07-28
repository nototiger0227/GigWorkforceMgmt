import { Router } from 'express';
import { createRiderSchema, updateRiderOnlineSchema, updateRiderLocationSchema } from '@gig/shared';
import { Role } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';
import { authenticate, requireRole, validateBody } from '../middleware/auth.js';
import { toRiderDto } from '../services/mappers.js';
import { WS_EVENTS, emitToAdmin, emitToRider, broadcastAnalytics } from '../realtime/socket.js';
import { invalidateAnalyticsCache } from '../services/analytics.js';

export const ridersRouter = Router();

ridersRouter.use(authenticate);

ridersRouter.get('/', requireRole(Role.ADMIN), async (_req, res) => {
  const riders = await prisma.rider.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ riders: riders.map(toRiderDto) });
});

ridersRouter.post('/', requireRole(Role.ADMIN), validateBody(createRiderSchema), async (req, res) => {
  const { email, password, platformTags } = req.body;
  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: Role.RIDER,
      rider: { create: { platformTags } },
    },
    include: { rider: { include: { user: { select: { email: true } } } } },
  });

  res.status(201).json({ rider: toRiderDto(user.rider!) });
});

ridersRouter.get('/me', requireRole(Role.RIDER), async (req, res) => {
  const rider = await prisma.rider.findUnique({
    where: { userId: req.user!.id },
    include: { user: { select: { email: true } } },
  });
  if (!rider) {
    res.status(404).json({ error: 'Rider profile not found' });
    return;
  }
  res.json({ rider: toRiderDto(rider) });
});

ridersRouter.patch('/me/online', requireRole(Role.RIDER), validateBody(updateRiderOnlineSchema), async (req, res) => {
  const { isOnline } = req.body;

  const rider = await prisma.rider.update({
    where: { userId: req.user!.id },
    data: { isOnline },
    include: { user: { select: { email: true } } },
  });

  const event = isOnline ? WS_EVENTS.RIDER_ONLINE : WS_EVENTS.RIDER_OFFLINE;
  emitToAdmin(event, { riderId: rider.id, isOnline, timestamp: new Date().toISOString() });
  emitToRider(rider.id, event, { riderId: rider.id, isOnline, timestamp: new Date().toISOString() });
  invalidateAnalyticsCache();
  broadcastAnalytics('admin');

  res.json({ rider: toRiderDto(rider) });
});

ridersRouter.patch('/me/location', requireRole(Role.RIDER), validateBody(updateRiderLocationSchema), async (req, res) => {
  const { lat, lng } = req.body;

  const rider = await prisma.rider.update({
    where: { userId: req.user!.id },
    data: { lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
    include: { user: { select: { email: true } } },
  });

  res.json({ rider: toRiderDto(rider) });
});

ridersRouter.patch('/:id/verify', requireRole(Role.ADMIN), async (req, res) => {
  const isVerified = Boolean(req.body.isVerified ?? true);
  const rider = await prisma.rider.update({
    where: { id: req.params.id as string },
    data: { isVerified },
    include: { user: { select: { email: true } } },
  });
  res.json({ rider: toRiderDto(rider) });
});
