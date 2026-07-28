import { Router } from 'express';
import { withdrawSchema } from '@gig/shared';
import { Role } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole, validateBody } from '../middleware/auth.js';
import { toPayoutDto } from '../services/mappers.js';
import { markPayoutPaid, withdrawToUpi } from '../services/payouts.js';

export const payoutsRouter = Router();

payoutsRouter.use(authenticate);

payoutsRouter.get('/me', requireRole(Role.RIDER), async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
  if (!rider) {
    res.status(404).json({ error: 'Rider not found' });
    return;
  }

  const [payouts, withdrawals] = await Promise.all([
    prisma.payout.findMany({ where: { riderId: rider.id }, orderBy: { createdAt: 'desc' } }),
    prisma.withdrawal.findMany({ where: { riderId: rider.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  res.json({
    walletBalance: rider.walletBalance.toString(),
    payouts: payouts.map(toPayoutDto),
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount.toString(),
      upiId: w.upiId,
      status: w.status,
      providerId: w.providerId,
      createdAt: w.createdAt.toISOString(),
    })),
  });
});

payoutsRouter.post('/withdraw', requireRole(Role.RIDER), validateBody(withdrawSchema), async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
  if (!rider) {
    res.status(404).json({ error: 'Rider not found' });
    return;
  }

  if (!rider.isVerified) {
    res.status(403).json({ error: 'Complete KYC verification before withdrawing' });
    return;
  }

  try {
    const withdrawal = await withdrawToUpi(rider.id, req.body.amount, req.body.upiId);
    const updated = await prisma.rider.findUnique({ where: { id: rider.id } });
    res.json({
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount.toString(),
        status: withdrawal.status,
        providerId: withdrawal.providerId,
      },
      walletBalance: updated!.walletBalance.toString(),
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Withdrawal failed' });
  }
});

payoutsRouter.get('/', requireRole(Role.ADMIN), async (_req, res) => {
  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { rider: { include: { user: { select: { email: true } } } } },
  });

  res.json({
    payouts: payouts.map((p) => ({
      ...toPayoutDto(p),
      riderEmail: p.rider.user.email,
    })),
  });
});

payoutsRouter.patch('/:id/paid', requireRole(Role.ADMIN), async (req, res) => {
  const payout = await markPayoutPaid(req.params.id as string);
  res.json({ payout: toPayoutDto(payout) });
});
