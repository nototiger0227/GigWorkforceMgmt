import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export const createZoneSchema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
});

export const createGigSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  zoneId: z.string().cuid().optional(),
  pickupZone: z.string().min(2).max(200),
  serviceArea: z.string().min(2).max(200),
  pickupLat: z.number().min(-90).max(90).optional(),
  pickupLng: z.number().min(-180).max(180).optional(),
  requiredRiders: z.number().int().min(1).max(50).default(1),
  payAmount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  startsAt: z.coerce.date().default(() => new Date()),
  expiresAt: z.coerce.date().default(() => new Date(Date.now() + 24 * 60 * 60 * 1000)),
  preferPlatformTags: z.array(z.string()).optional(),
}).refine((data) => data.expiresAt > data.startsAt, {
  message: 'expiresAt must be after startsAt',
  path: ['expiresAt'],
});

export const partnerGigWebhookSchema = z.object({
  externalId: z.string().min(1),
  companyId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  zoneId: z.string().optional(),
  pickupZone: z.string().min(2).max(200),
  serviceArea: z.string().min(2).max(200),
  pickupLat: z.coerce.number().min(-90).max(90).optional(),
  pickupLng: z.coerce.number().min(-180).max(180).optional(),
  requiredRiders: z.coerce.number().int().min(1).max(50).optional(),
  payAmount: z.coerce.number().positive(),
  currency: z.string().length(3).default('INR'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

export const updateRiderLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateRiderOnlineSchema = z.object({
  isOnline: z.boolean(),
});

export const createRiderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  platformTags: z.array(z.string()).default([]),
});

export const createCompanyUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  companyId: z.string().cuid(),
});

export const kycSubmitSchema = z.object({
  documentType: z.enum(['AADHAAR', 'PAN', 'DRIVING_LICENSE']),
  documentNumber: z.string().min(4).max(20),
});

export const kycReviewSchema = z.object({
  approved: z.boolean(),
  reviewNote: z.string().max(500).optional(),
});

export const dispatchSchema = z.object({
  gigId: z.string().cuid(),
  riderId: z.string().cuid(),
});

export const withdrawSchema = z.object({
  amount: z.number().positive().max(100000),
  upiId: z.string().regex(/^[\w.\-]+@[\w.\-]+$/i, 'Invalid UPI ID'),
});

export const roleSchema = z.enum(['ADMIN', 'COMPANY', 'RIDER']);
export const gigStatusSchema = z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const assignmentStatusSchema = z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export const urgencySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type CreateGigInput = z.infer<typeof createGigSchema>;
export type PartnerGigWebhookInput = z.infer<typeof partnerGigWebhookSchema>;
export type UpdateRiderLocationInput = z.infer<typeof updateRiderLocationSchema>;
export type UpdateRiderOnlineInput = z.infer<typeof updateRiderOnlineSchema>;
export type CreateRiderInput = z.infer<typeof createRiderSchema>;
export type CreateCompanyUserInput = z.infer<typeof createCompanyUserSchema>;
export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
