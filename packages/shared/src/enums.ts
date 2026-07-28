export const Role = {
  ADMIN: 'ADMIN',
  COMPANY: 'COMPANY',
  RIDER: 'RIDER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const GigStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type GigStatus = (typeof GigStatus)[keyof typeof GigStatus];

export const AssignmentStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const Urgency = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const WS_EVENTS = {
  GIG_CREATED: 'gig:created',
  GIG_UPDATED: 'gig:updated',
  GIG_CANCELLED: 'gig:cancelled',
  GIG_ASSIGNED: 'gig:assigned',
  GIG_STARTED: 'gig:started',
  GIG_COMPLETED: 'gig:completed',
  RIDER_ONLINE: 'rider:online',
  RIDER_OFFLINE: 'rider:offline',
  ANALYTICS_UPDATED: 'analytics:updated',
  NOTIFICATION: 'notification:new',
} as const;

export type WsEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
