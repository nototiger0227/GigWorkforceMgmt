import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { AuthUser } from '@gig/shared';
import { WS_EVENTS } from '@gig/shared';
import { env } from '../config/env.js';
import { verifyToken } from '../lib/jwt.js';

let io: Server | null = null;

export async function initSocket(httpServer: HttpServer): Promise<Server> {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  try {
    const pub = createClient({ url: env.redisUrl });
    const sub = pub.duplicate();
    pub.on('error', (err) => console.error('Redis pub error:', err.message));
    sub.on('error', (err) => console.error('Redis sub error:', err.message));
    await Promise.all([pub.connect(), sub.connect()]);
    io.adapter(createAdapter(pub, sub));
    console.log('Socket.IO Redis adapter initialized');
  } catch (err) {
    console.warn('Redis pub/sub not available for Socket.IO, using default in-memory adapter');
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as AuthUser;

    socket.join(`user:${user.id}`);

    if (user.role === 'ADMIN') socket.join('admin');
    if (user.role === 'COMPANY' && user.companyId) socket.join(`company:${user.companyId}`);
    if (user.role === 'RIDER') {
      socket.join('riders');
      if (user.riderId) socket.join(`rider:${user.riderId}`);
    }

    socket.on('join:zone', (zoneId: string) => socket.join(`zone:${zoneId}`));
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitToAdmin(event: string, data: unknown): void {
  getIO().to('admin').emit(event, data);
}

export function emitToCompany(companyId: string, event: string, data: unknown): void {
  getIO().to(`company:${companyId}`).emit(event, data);
}

export function emitToRider(riderId: string, event: string, data: unknown): void {
  getIO().to(`rider:${riderId}`).emit(event, data);
  getIO().emit(event, data);
}

export function emitToRiders(event: string, data: unknown): void {
  getIO().to('riders').emit(event, data);
  getIO().emit(event, data);
}

export function emitToZone(zoneId: string, event: string, data: unknown): void {
  getIO().to(`zone:${zoneId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function broadcastAnalytics(scope: 'admin' | 'company', companyId?: string): void {
  const payload = { scope, companyId, timestamp: new Date().toISOString() };
  emitToAdmin(WS_EVENTS.ANALYTICS_UPDATED, payload);
  if (companyId) emitToCompany(companyId, WS_EVENTS.ANALYTICS_UPDATED, payload);
}

export { WS_EVENTS };
