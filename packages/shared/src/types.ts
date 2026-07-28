import type { AssignmentStatus, GigStatus, Role, Urgency } from './enums.js';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  companyId?: string;
  riderId?: string;
}

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

export interface GigDto {
  id: string;
  companyId: string;
  companyName?: string;
  zoneId: string | null;
  title: string;
  description: string | null;
  pickupZone: string;
  serviceArea: string;
  pickupLat: number | null;
  pickupLng: number | null;
  requiredRiders: number;
  basePayAmount: string;
  surgeMultiplier: string;
  payAmount: string;
  currency: string;
  urgency: Urgency;
  status: GigStatus;
  partnerSource: string | null;
  externalId: string | null;
  preferPlatformTags: string[];
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  assignments?: AssignmentDto[];
  matchScore?: number;
}

export interface PayoutDto {
  id: string;
  riderId: string;
  assignmentId: string;
  amount: string;
  status: 'PENDING' | 'PAID';
  createdAt: string;
  paidAt: string | null;
}

export interface AssignmentDto {
  id: string;
  gigId: string;
  riderId: string;
  riderName?: string;
  status: AssignmentStatus;
  acceptedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface RiderDto {
  id: string;
  userId: string;
  email: string;
  isOnline: boolean;
  isVerified: boolean;
  platformTags: string[];
  currentGigId: string | null;
  walletBalance: string;
  lastLat: number | null;
  lastLng: number | null;
}

export interface CompanyDto {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  zones: ZoneDto[];
}

export interface ZoneDto {
  id: string;
  name: string;
  city: string;
  companyId: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number;
}

export interface AnalyticsOverview {
  openGigs: number;
  unfilledGigs: number;
  avgTimeToFillMinutes: number;
  activeOnlineRiders: number;
  fillRatePercent: number;
  criticalShortageCount: number;
  gigsPostedLast24h: number;
  gigsFilledLast24h: number;
  hourlyStats: HourlyStat[];
  shortageByZone: ZoneShortage[];
}

export interface HourlyStat {
  hour: string;
  posted: number;
  filled: number;
}

export interface ZoneShortage {
  zoneName: string;
  city: string;
  openCount: number;
  criticalCount: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface OpsMapData {
  riders: OpsMapRider[];
  openGigs: OpsMapGig[];
  active: OpsMapActive[];
}

export interface OpsMapRider {
  id: string;
  email: string;
  lat: number;
  lng: number;
  isOnline: boolean;
}

export interface OpsMapGig {
  id: string;
  title: string;
  lat: number;
  lng: number;
  urgency: Urgency;
  payAmount: string;
}

export interface OpsMapActive {
  gigId: string;
  gigTitle: string;
  riderId: string;
  riderEmail: string;
  lat: number;
  lng: number;
  status: GigStatus;
}
export interface LoginResponse {
  token: string;
  user: AuthUser;
}
