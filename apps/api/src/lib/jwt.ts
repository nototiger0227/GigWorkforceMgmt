import jwt from 'jsonwebtoken';
import type { AuthUser, JwtPayload } from '@gig/shared';
import { env } from '../config/env.js';

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export function extractBearerToken(header?: string): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}
