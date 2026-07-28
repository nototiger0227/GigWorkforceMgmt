import { Router } from 'express';
import { Role } from '@gig/shared';
import { env } from '../config/env.js';
import { getPartnerAdapter } from '../integrations/partner-adapter.js';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createGig } from '../services/create-gig.js';
import { toGigDto } from '../services/mappers.js';
import { gigInclude } from '../services/gig-history.js';

export const integrationsRouter = Router();

integrationsRouter.post('/:partner/gigs', async (req, res) => {
  const partner = req.params.partner.toLowerCase();
  const adapter = getPartnerAdapter(partner);

  if (!adapter) {
    res.status(404).json({ error: 'Unknown partner' });
    return;
  }

  const secret = req.headers['x-webhook-secret'];
  if (secret !== env.webhookSecrets[partner]) {
    res.status(401).json({ error: 'Invalid webhook secret' });
    return;
  }

  try {
    const input = adapter.parsePayload(req.body);

    if (input.externalId) {
      const existing = await prisma.gig.findUnique({
        where: { partnerSource_externalId: { partnerSource: partner, externalId: input.externalId } },
        include: gigInclude,
      });
      if (existing) {
        res.json({ gig: toGigDto(existing), duplicate: true });
        return;
      }
    }

    const gig = await createGig(input);
    res.status(201).json({ gig: toGigDto(gig) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook ingest failed';
    res.status(400).json({ error: message });
  }
});

integrationsRouter.get('/deliveries', authenticate, requireRole(Role.ADMIN), async (_req, res) => {
  const deliveries = await prisma.webhookDelivery.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({
    deliveries: deliveries.map((d) => ({
      id: d.id,
      partner: d.partner,
      event: d.event,
      status: d.status,
      attempts: d.attempts,
      lastError: d.lastError,
      createdAt: d.createdAt.toISOString(),
      deliveredAt: d.deliveredAt?.toISOString() ?? null,
    })),
  });
});
