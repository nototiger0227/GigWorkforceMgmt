import { Router } from 'express';
import { createCompanySchema, createZoneSchema, createCompanyUserSchema, Role } from '@gig/shared';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';
import { authenticate, requireRole, validateBody } from '../middleware/auth.js';
import { toCompanyDto } from '../services/mappers.js';

export const companiesRouter = Router();

companiesRouter.use(authenticate);

companiesRouter.get('/', requireRole(Role.ADMIN), async (_req, res) => {
  const companies = await prisma.company.findMany({
    include: { zones: true },
    orderBy: { name: 'asc' },
  });
  res.json({ companies: companies.map(toCompanyDto) });
});

companiesRouter.post('/', requireRole(Role.ADMIN), validateBody(createCompanySchema), async (req, res) => {
  const company = await prisma.company.create({
    data: req.body,
    include: { zones: true },
  });
  res.status(201).json({ company: toCompanyDto(company) });
});

companiesRouter.post('/:id/zones', requireRole(Role.ADMIN), validateBody(createZoneSchema), async (req, res) => {
  const zone = await prisma.zone.create({
    data: { ...req.body, companyId: req.params.id },
  });
  res.status(201).json({ zone });
});

companiesRouter.post('/users', requireRole(Role.ADMIN), validateBody(createCompanyUserSchema), async (req, res) => {
  const { email, password, companyId } = req.body;
  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: Role.COMPANY,
      companyId,
    },
  });

  res.status(201).json({
    user: { id: user.id, email: user.email, role: user.role, companyId },
  });
});
