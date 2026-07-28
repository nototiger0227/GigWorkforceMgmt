import { Router } from 'express';
import { kycSubmitSchema, kycReviewSchema } from '@gig/shared';
import { Role } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole, validateBody } from '../middleware/auth.js';
import { notifyUser } from '../services/notifications.js';

export const kycRouter = Router();

kycRouter.use(authenticate);

kycRouter.post('/submit', requireRole(Role.RIDER), validateBody(kycSubmitSchema), async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
  if (!rider) {
    res.status(404).json({ error: 'Rider not found' });
    return;
  }

  const pending = await prisma.kycSubmission.findFirst({
    where: { riderId: rider.id, status: 'PENDING' },
  });
  if (pending) {
    res.status(400).json({ error: 'You already have a pending KYC submission' });
    return;
  }

  const submission = await prisma.kycSubmission.create({
    data: { riderId: rider.id, ...req.body },
  });

  res.status(201).json({
    submission: {
      id: submission.id,
      documentType: submission.documentType,
      status: submission.status,
      createdAt: submission.createdAt.toISOString(),
    },
  });
});

kycRouter.get('/me', requireRole(Role.RIDER), async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.id } });
  if (!rider) {
    res.status(404).json({ error: 'Rider not found' });
    return;
  }

  const submissions = await prisma.kycSubmission.findMany({
    where: { riderId: rider.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  res.json({
    isVerified: rider.isVerified,
    submissions: submissions.map((s) => ({
      id: s.id,
      documentType: s.documentType,
      documentNumber: maskDoc(s.documentNumber),
      status: s.status,
      reviewNote: s.reviewNote,
      createdAt: s.createdAt.toISOString(),
      reviewedAt: s.reviewedAt?.toISOString() ?? null,
    })),
  });
});

kycRouter.get('/pending', requireRole(Role.ADMIN), async (_req, res) => {
  const submissions = await prisma.kycSubmission.findMany({
    where: { status: 'PENDING' },
    include: { rider: { include: { user: { select: { email: true } } } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    submissions: submissions.map((s) => ({
      id: s.id,
      riderEmail: s.rider.user.email,
      documentType: s.documentType,
      documentNumber: s.documentNumber,
      createdAt: s.createdAt.toISOString(),
    })),
  });
});

kycRouter.patch('/:id/review', requireRole(Role.ADMIN), validateBody(kycReviewSchema), async (req, res) => {
  const { approved, reviewNote } = req.body;

  const submission = await prisma.kycSubmission.findUnique({ where: { id: req.params.id as string } });
  if (!submission || submission.status !== 'PENDING') {
    res.status(404).json({ error: 'Pending submission not found' });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const sub = await tx.kycSubmission.update({
      where: { id: submission.id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewNote,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
    });

    await tx.rider.update({
      where: { id: submission.riderId },
      data: { isVerified: approved },
    });

    return sub;
  });

  const riderUser = await prisma.rider.findUnique({
    where: { id: submission.riderId },
    include: { user: { select: { id: true } } },
  });
  if (riderUser) {
    await notifyUser(
      riderUser.user.id,
      approved ? 'KYC approved' : 'KYC rejected',
      approved ? 'You can now accept critical gigs and withdraw.' : (reviewNote ?? 'Please resubmit documents.'),
    );
  }

  res.json({ submission: { id: updated.id, status: updated.status } });
});

function maskDoc(num: string): string {
  if (num.length <= 4) return '****';
  return '*'.repeat(num.length - 4) + num.slice(-4);
}
