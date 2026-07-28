import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient, Role, Urgency, GigStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });
config({ path: resolve(__dirname, '../../../prisma/.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@gig.local' },
    update: {},
    create: { email: 'admin@gig.local', password, role: Role.ADMIN },
  });

  const companyA = await prisma.company.upsert({
    where: { id: 'seed-company-a' },
    update: {},
    create: {
      id: 'seed-company-a',
      name: 'QuickEats Logistics',
      contactEmail: 'ops@quickeats.local',
      contactPhone: '+91-9876543210',
    },
  });

  const companyB = await prisma.company.upsert({
    where: { id: 'seed-company-b' },
    update: {},
    create: {
      id: 'seed-company-b',
      name: 'UrbanDash Delivery',
      contactEmail: 'ops@urbandash.local',
      contactPhone: '+91-9876543211',
    },
  });

  const zoneData = [
    { name: 'Koramangala', city: 'Bangalore', companyId: companyA.id, centerLat: 12.9352, centerLng: 77.6245 },
    { name: 'Indiranagar', city: 'Bangalore', companyId: companyA.id, centerLat: 12.9784, centerLng: 77.6408 },
    { name: 'Bandra West', city: 'Mumbai', companyId: companyB.id, centerLat: 19.0596, centerLng: 72.8295 },
    { name: 'Andheri East', city: 'Mumbai', companyId: companyB.id, centerLat: 19.1136, centerLng: 72.8697 },
  ];

  for (const z of zoneData) {
    const existing = await prisma.zone.findFirst({ where: { name: z.name, companyId: z.companyId } });
    if (existing) {
      await prisma.zone.update({ where: { id: existing.id }, data: z });
    } else {
      await prisma.zone.create({ data: z });
    }
  }

  await prisma.user.upsert({
    where: { email: 'company-a@gig.local' },
    update: {},
    create: { email: 'company-a@gig.local', password, role: Role.COMPANY, companyId: companyA.id },
  });

  await prisma.user.upsert({
    where: { email: 'company-b@gig.local' },
    update: {},
    create: { email: 'company-b@gig.local', password, role: Role.COMPANY, companyId: companyB.id },
  });

  const riders = [
    { email: 'rider1@gig.local', tags: ['swiggy', 'zomato'], lat: 12.934, lng: 77.62 },
    { email: 'rider2@gig.local', tags: ['swiggy'], lat: 12.97, lng: 77.64 },
    { email: 'rider3@gig.local', tags: ['zomato'], lat: 12.94, lng: 77.63 },
    { email: 'rider4@gig.local', tags: ['swiggy', 'blinkit'], lat: 19.06, lng: 72.83 },
    { email: 'rider5@gig.local', tags: ['zomato', 'blinkit'], lat: 19.11, lng: 72.87 },
  ];

  for (const r of riders) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        password,
        role: Role.RIDER,
        rider: {
          create: {
            platformTags: r.tags,
            isVerified: false,
            lastLat: r.lat,
            lastLng: r.lng,
            lastLocationAt: new Date(),
          },
        },
      },
    });
  }

  const zone = await prisma.zone.findFirst({ where: { companyId: companyA.id, name: 'Koramangala' } });

  if ((await prisma.gig.count()) === 0) {
    const now = new Date();
    await prisma.gig.create({
      data: {
        companyId: companyA.id,
        zoneId: zone?.id,
        title: 'Urgent dinner rush — Koramangala',
        description: 'Need verified rider for peak hour deliveries',
        pickupZone: 'Koramangala 5th Block',
        serviceArea: 'Bangalore South',
        pickupLat: 12.9352,
        pickupLng: 77.6245,
        requiredRiders: 1,
        basePayAmount: 450,
        surgeMultiplier: 1,
        payAmount: 450,
        currency: 'INR',
        urgency: Urgency.CRITICAL,
        status: GigStatus.OPEN,
        startsAt: new Date(now.getTime() - 15 * 60000),
        expiresAt: new Date(now.getTime() + 4 * 60 * 60000),
      },
    });

    await prisma.gig.create({
      data: {
        companyId: companyB.id,
        title: 'Lunch shift — Bandra',
        description: 'Standard delivery run',
        pickupZone: 'Bandra West',
        serviceArea: 'Mumbai West',
        pickupLat: 19.0596,
        pickupLng: 72.8295,
        requiredRiders: 1,
        basePayAmount: 350,
        surgeMultiplier: 1,
        payAmount: 350,
        currency: 'INR',
        urgency: Urgency.MEDIUM,
        status: GigStatus.OPEN,
        startsAt: new Date(now.getTime() + 60 * 60000),
        expiresAt: new Date(now.getTime() + 6 * 60 * 60000),
      },
    });
  }

  console.log('Seed complete! (password: password123)');
  console.log('  Admin: admin@gig.local');
  console.log('  Company: company-a@gig.local');
  console.log('  Rider: rider1@gig.local');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
