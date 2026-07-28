import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { createUpiTransfer } from './razorpay.js';

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function creditRiderPayout(
  riderId: string,
  assignmentId: string,
  amount: number,
  db: DbClient = prisma,
) {
  const payout = await db.payout.create({
    data: { riderId, assignmentId, amount },
  });

  await db.rider.update({
    where: { id: riderId },
    data: { walletBalance: { increment: amount } },
  });

  return payout;
}

export async function markPayoutPaid(payoutId: string) {
  return prisma.payout.update({
    where: { id: payoutId },
    data: { status: 'PAID', paidAt: new Date() },
  });
}

export async function withdrawToUpi(riderId: string, amount: number, upiId: string) {
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) throw new Error('Rider not found');
  if (Number(rider.walletBalance) < amount) throw new Error('Insufficient wallet balance');

  const withdrawal = await prisma.$transaction(async (tx) => {
    await tx.rider.update({
      where: { id: riderId },
      data: { walletBalance: { decrement: amount } },
    });

    return tx.withdrawal.create({
      data: { riderId, amount, upiId, status: 'PENDING' },
    });
  });

  try {
    const result = await createUpiTransfer(amount, upiId, withdrawal.id);

    return prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: result.status === 'failed' ? 'FAILED' : 'PAID',
        providerId: result.providerId,
        processedAt: result.status !== 'failed' ? new Date() : null,
      },
    });
  } catch (err) {
    await prisma.$transaction(async (tx) => {
      await tx.rider.update({
        where: { id: riderId },
        data: { walletBalance: { increment: amount } },
      });
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: 'FAILED' },
      });
    });
    throw err;
  }
}
