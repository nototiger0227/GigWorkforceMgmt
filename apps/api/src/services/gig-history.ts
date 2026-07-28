import type { GigStatus } from '@gig/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function recordStatusChange(
  gigId: string,
  toStatus: GigStatus,
  changedById?: string,
  fromStatus?: GigStatus | null,
  reason?: string,
  db: DbClient = prisma,
) {
  return db.gigStatusHistory.create({
    data: {
      gigId,
      fromStatus: fromStatus ?? undefined,
      toStatus,
      changedById,
      reason,
    },
  });
}

export const gigInclude = {
  company: { select: { name: true } },
  assignments: {
    include: {
      rider: { include: { user: { select: { email: true } } } },
    },
  },
} as const;
