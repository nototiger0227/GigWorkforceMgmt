import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './config/env.js';
import { initSocket } from './realtime/socket.js';
import { startWebhookRetryWorker } from './services/partner-callbacks.js';
import { authRouter } from './routes/auth.js';
import { companiesRouter } from './routes/companies.js';
import { ridersRouter } from './routes/riders.js';
import { gigsRouter } from './routes/gigs.js';
import { assignmentsRouter } from './routes/assignments.js';
import { analyticsRouter } from './routes/analytics.js';
import { integrationsRouter } from './routes/integrations.js';
import { payoutsRouter } from './routes/payouts.js';
import { kycRouter } from './routes/kyc.js';
import { notificationsRouter } from './routes/notifications.js';
import { opsRouter } from './routes/ops.js';

const app = express();
const httpServer = createServer(app);

await initSocket(httpServer);
startWebhookRetryWorker();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/companies', companiesRouter);
app.use('/riders', ridersRouter);
app.use('/gigs', gigsRouter);
app.use('/assignments', assignmentsRouter);
app.use('/analytics', analyticsRouter);
app.use('/integrations', integrationsRouter);
app.use('/payouts', payoutsRouter);
app.use('/kyc', kycRouter);
app.use('/notifications', notificationsRouter);
app.use('/ops', opsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
