import { Router } from 'express';
import { loginSchema } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { comparePassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { authenticate, validateBody } from '../middleware/auth.js';
import { toAuthUser } from '../services/mappers.js';

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true, rider: true },
  });

  if (!user || !(await comparePassword(password, user.password))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const authUser = toAuthUser(user);
  const token = signToken(authUser);
  res.json({ token, user: authUser });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { company: true, rider: true },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user: toAuthUser(user) });
});
