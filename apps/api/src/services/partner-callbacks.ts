import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

const RETRY_DELAYS_MS = [30_000, 120_000, 300_000];

export interface PartnerEventPayload {
  event: 'gig.assigned' | 'gig.completed';
  gigId: string;
  externalId: string | null;
  riderId: string;
  timestamp: string;
}

export async function dispatchPartnerEvent(
  partner: string,
  event: PartnerEventPayload['event'],
  payload: Omit<PartnerEventPayload, 'event' | 'timestamp'>,
) {
  const body: PartnerEventPayload = { ...payload, event, timestamp: new Date().toISOString() };

  const delivery = await prisma.webhookDelivery.create({
    data: {
      partner,
      event,
      payload: body as any,
      maxAttempts: 3,
    },
  });

  await attemptDelivery(delivery.id);
}

async function attemptDelivery(deliveryId: string) {
  const delivery = await prisma.webhookDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.status === 'SUCCESS') return;

  const url = env.partnerCallbackUrls[delivery.partner];
  const attempts = delivery.attempts + 1;

  if (!url) {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'SUCCESS',
        attempts,
        deliveredAt: new Date(),
        lastError: 'No callback URL — logged only',
      },
    });
    console.log(`[callback:${delivery.partner}] ${delivery.event}`, delivery.payload);
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.webhookSecrets[delivery.partner] ?? '',
      },
      body: JSON.stringify(delivery.payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: 'SUCCESS', attempts, deliveredAt: new Date(), lastError: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delivery failed';
    const failed = attempts >= delivery.maxAttempts;

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: failed ? 'FAILED' : 'PENDING',
        attempts,
        lastError: message,
        nextRetryAt: failed ? null : new Date(Date.now() + (RETRY_DELAYS_MS[attempts - 1] || 300_000)),
      },
    });
  }
}

export async function retryPendingWebhooks() {
  const due = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      attempts: { lt: 3 },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: 20,
  });

  for (const d of due) {
    if (d.attempts < d.maxAttempts) await attemptDelivery(d.id);
  }
}

export function startWebhookRetryWorker(intervalMs = 60_000) {
  setInterval(() => {
    retryPendingWebhooks().catch((err) => console.error('Webhook retry error:', err.message));
  }, intervalMs);
}
