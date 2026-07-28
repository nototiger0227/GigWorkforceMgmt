import type { CreateGigInput } from '../services/create-gig.js';
import { partnerGigWebhookSchema } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { dispatchPartnerEvent } from '../services/partner-callbacks.js';

export interface PartnerAdapter {
  name: string;
  parsePayload(raw: unknown): CreateGigInput;
}

function baseParse(raw: unknown, partnerSource: string): CreateGigInput {
  const data = partnerGigWebhookSchema.parse(raw);
  return {
    companyId: data.companyId,
    title: data.title,
    description: data.description,
    zoneId: data.zoneId,
    pickupZone: data.pickupZone,
    serviceArea: data.serviceArea,
    pickupLat: data.pickupLat,
    pickupLng: data.pickupLng,
    requiredRiders: data.requiredRiders,
    payAmount: data.payAmount,
    currency: data.currency,
    urgency: data.urgency,
    startsAt: data.startsAt,
    expiresAt: data.expiresAt,
    partnerSource,
    externalId: data.externalId,
  };
}

class SwiggyAdapter implements PartnerAdapter {
  name = 'swiggy';

  parsePayload(raw: unknown): CreateGigInput {
    const r = raw as Record<string, unknown>;
    if (r.order_id) {
      return baseParse(
        {
          externalId: String(r.order_id),
          companyId: r.company_id,
          title: r.title ?? `Swiggy order ${r.order_id}`,
          pickupZone: r.pickup_zone ?? r.pickupZone,
          serviceArea: r.service_area ?? r.serviceArea,
          pickupLat: r.pickup_lat ?? r.pickupLat,
          pickupLng: r.pickup_lng ?? r.pickupLng,
          payAmount: r.pay_amount ?? r.payAmount,
          urgency: r.urgency ?? 'HIGH',
          startsAt: r.starts_at ?? r.startsAt ?? new Date(),
          expiresAt: r.expires_at ?? r.expiresAt ?? new Date(Date.now() + 4 * 3600000),
        },
        this.name,
      );
    }
    return baseParse(raw, this.name);
  }
}

class ZomatoAdapter implements PartnerAdapter {
  name = 'zomato';

  parsePayload(raw: unknown): CreateGigInput {
    const r = raw as Record<string, unknown>;
    if (r.ref_id) {
      return baseParse(
        {
          externalId: String(r.ref_id),
          companyId: r.companyId ?? r.company_id,
          title: r.job_title ?? r.title ?? `Zomato delivery ${r.ref_id}`,
          pickupZone: r.pickup_area ?? r.pickupZone,
          serviceArea: r.city ?? r.serviceArea,
          pickupLat: r.lat ?? r.pickupLat,
          pickupLng: r.lng ?? r.pickupLng,
          payAmount: r.payout ?? r.payAmount,
          urgency: r.priority ?? 'MEDIUM',
          startsAt: r.start_time ?? new Date(),
          expiresAt: r.end_time ?? new Date(Date.now() + 4 * 3600000),
        },
        this.name,
      );
    }
    return baseParse(raw, this.name);
  }
}

const adapters: Record<string, PartnerAdapter> = {
  swiggy: new SwiggyAdapter(),
  zomato: new ZomatoAdapter(),
};

export function getPartnerAdapter(partner: string): PartnerAdapter | null {
  return adapters[partner.toLowerCase()] ?? null;
}

export async function notifyPartner(
  partnerSource: string | null | undefined,
  gigId: string,
  riderId: string,
  event: 'assigned' | 'completed',
) {
  if (!partnerSource) return;

  const gig = await prisma.gig.findUnique({ where: { id: gigId }, select: { externalId: true } });
  const partnerEvent = event === 'assigned' ? 'gig.assigned' : 'gig.completed';

  await dispatchPartnerEvent(partnerSource, partnerEvent, {
    gigId,
    externalId: gig?.externalId ?? null,
    riderId,
  });
}
