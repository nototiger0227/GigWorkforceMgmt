import { Router } from 'express';
import { loginSchema, registerSchema, adminCreateSchema, Role } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { comparePassword, hashPassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { authenticate, requireRole, validateBody } from '../middleware/auth.js';
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

authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  const { email, password, role, companyName } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.$transaction(async (tx) => {
      let createdCompanyId: string | undefined = undefined;

      if (role === Role.COMPANY) {
        const company = await tx.company.create({
          data: { name: companyName! },
        });
        createdCompanyId = company.id;
      }

      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          companyId: createdCompanyId,
        },
      });

      if (role === Role.RIDER) {
        await tx.rider.create({
          data: {
            userId: createdUser.id,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: createdUser.id },
        include: { company: true, rider: true },
      });
    });

    const authUser = toAuthUser(user!);
    const token = signToken(authUser);
    res.status(201).json({ token, user: authUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

authRouter.post('/admin/register', authenticate, requireRole(Role.ADMIN), validateBody(adminCreateSchema), async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.ADMIN,
      },
      include: { company: true, rider: true }
    });
    res.status(201).json({ user: toAuthUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
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
