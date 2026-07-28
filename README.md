# Gig Workforce Platform

The Gig Workforce Platform is a real-time, end-to-end gig management operating system built to handle modern workforce operations. It bridges the gap between companies needing urgent gig workers (like delivery agents) and verified riders ready to take on tasks.

## 🚀 Key Features
- **Real-Time Gig Broadcasting**: Socket.IO powered infrastructure delivers gig opportunities to online riders in milliseconds.
- **Smart Matchmaking**: An intelligent algorithm sorts gigs for riders based on urgency, pay, distance, and platform tags.
- **Live Ops Map**: Geospatial visualization of online riders, open gigs, and active deliveries for admins and companies.
- **Identity & Trust**: Multi-document KYC verification (Aadhaar, PAN, DL) gates access to critical gigs and withdrawals.
- **Instant Payouts**: Riders earn into a digital wallet, with built-in UPI withdrawal capabilities.
- **Multi-Platform Aggregation**: Webhooks allow external partners (e.g., Swiggy, Zomato) to post gigs directly to the platform.
- **Premium Design System**: Dark-themed, glassmorphism UI with violet accents for a professional, classy aesthetic.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Socket.IO Client, TanStack Query, clsx
- **Backend**: Node.js, Express, Socket.IO, Prisma ORM
- **Database**: PostgreSQL (Primary Data), Redis (Caching & Message Broker)
- **Monorepo**: npm workspaces (`apps/web`, `apps/api`, `packages/shared`)
- **Language**: TypeScript throughout

## 📦 Setup & Installation

### Prerequisites
- Node.js (v20+ recommended)
- Docker Desktop (for running Postgres & Redis)

### Quick Start

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Set up your local `.env` files based on the examples.
   ```bash
   cp .env.example .env
   cp .env.example prisma/.env
   ```

3. **Start Infrastructure (Database & Redis)**
   Make sure Docker Desktop is running.
   ```bash
   npm run db:up
   ```

4. **Initialize Database**
   Wait ~10 seconds for Postgres to be fully ready, then run the setup script which handles migrations and seeding.
   ```bash
   npm run db:setup
   ```

5. **Start Development Servers**
   Runs both the API backend and the React frontend concurrently.
   ```bash
   npm run dev
   ```

## 🎮 Usage

Once running, access the web client at: `http://localhost:5173`

### Demo Accounts
Password for all accounts: `password123`

| Role    | Email               | Description |
|---------|---------------------|-------------|
| **Admin**   | admin@gig.local     | Full platform oversight, Live Ops Map, KYC approvals, dispatching. |
| **Company** | company-a@gig.local | Post gigs, view analytics, manage zones. |
| **Rider**   | rider1@gig.local    | Go online/offline, accept gigs, view wallet, submit KYC. |

## 🏗 Project Structure

```text
projectvf/
├── apps/
│   ├── api/          # Express + Socket.IO Backend
│   │   ├── src/routes/     # REST endpoints
│   │   ├── src/realtime/   # WebSocket handlers
│   │   └── src/services/   # Core business logic
│   └── web/          # React + Vite Frontend
│       ├── src/components/ # UI and feature components
│       ├── src/pages/      # Route pages
│       └── src/context/    # React Context (Auth)
├── packages/
│   └── shared/       # Shared TS types, schemas, and enums
├── prisma/           # Prisma schema and seed scripts
├── docker-compose.yml# Postgres and Redis definitions
└── package.json      # Monorepo configuration
```

## ⚠️ Troubleshooting

If you encounter issues during database setup (`npm run db:setup`):

- **Connection refused (P1001)**: Ensure Docker Desktop is running and port 5432 is free.
- **Migration drift**: If Prisma complains about migration history, reset it:
  ```bash
  npm run db:up
  npm run db:reset
  ```

For more detailed technical documentation on system architecture and design, see [DOCUMENTATION.md](./DOCUMENTATION.md).
