import { WS_EVENTS } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { emitToUser } from '../realtime/socket.js';

export async function notifyUser(userId: string, title: string, message: string) {
  const notification = await prisma.notification.create({
    data: { userId, title, message },
  });

  const payload = {
    id: notification.id,
    title,
    message,
    read: false,
    createdAt: notification.createdAt.toISOString(),
  };

  emitToUser(userId, WS_EVENTS.NOTIFICATION, payload);
  return notification;
}

export async function notifyCompanyUsers(companyId: string, title: string, message: string) {
  const users = await prisma.user.findMany({ where: { companyId, role: 'COMPANY' } });
  for (const user of users) {
    await notifyUser(user.id, title, message);
  }
}
