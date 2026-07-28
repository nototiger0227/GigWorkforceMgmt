import { Router } from 'express';
import { Role } from '@gig/shared';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAnalyticsOverview } from '../services/analytics.js';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get('/overview', async (req, res) => {
  const user = req.user!;
  const scope = (req.query.scope as string) ?? (user.role === Role.ADMIN ? 'admin' : 'company');

  if (scope === 'admin' && user.role !== Role.ADMIN) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  if (scope === 'company') {
    if (user.role === Role.COMPANY && !user.companyId) {
      res.status(400).json({ error: 'Company profile required' });
      return;
    }
    if (user.role === Role.RIDER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
  }

  const companyId = scope === 'company' ? user.companyId : undefined;
  const overview = await getAnalyticsOverview(scope as 'admin' | 'company', companyId);
  res.json({ overview });
});
