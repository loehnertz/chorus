# chorus

A shared chore tracking web application with an innovative slot-based scheduling system. Built for couples and households who want to manage recurring tasks across different time frequencies.

## Overview

chorus helps you organize household chores using frequency pools (daily, weekly, monthly, yearly) and a unique slot-based system. Instead of rigid schedules, you can pull tasks from any frequency pool into your schedule—like tackling a yearly deep-cleaning task during a monthly slot.

**Deployment Model**: Each deployment represents a single household. All users share the same chore pool and can see each other's tasks.

## Key Features

- **Slot-based scheduling** - Flexible task scheduling across frequency pools
- **Multi-user support** - Track who's assigned to what and who completed tasks
- **Smart suggestions** - Algorithm suggests tasks based on completion history
- **Personal dashboards** - Each user sees their assigned tasks and quick stats
- **Completion tracking** - Full history of who did what and when
- **Mobile-friendly** - Responsive design optimized for touch interactions

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Neon Auth (built on Better Auth)
- **Styling**: TailwindCSS + custom CSS variables
- **Animation**: Framer Motion
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon account (for database and auth)

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Set up database and run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Common Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run test             # Run unit tests
npm run type-check       # Run TypeScript checks

# Pre-commit workflow (ALWAYS run before committing)
npm run lint && npm run test && npm run build

# Database
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Open Prisma Studio GUI
npx prisma db seed       # Run seed script
```

## Project Status

🚧 **In Active Development** - Currently implementing Phase 1 (v0.1.0)

See [PLAN.md](./PLAN.md) for the complete implementation roadmap and architecture details.

**Phases**:
1. v0.1.0 - Foundation & Setup ⏳
2. v0.2.0 - Authentication & User Management
3. v0.3.0 - Basic CRUD APIs
4. v0.4.0 - Suggestion Algorithm & Schedules
5. v0.5.0 - Dashboard & Main UI
6. v0.6.0 - Schedule System & Calendar
7. v1.0.0 - Polish & Production Release

## Design Philosophy

**"Domestic Futurism"** - A refined, slightly retro-futuristic aesthetic that elevates the mundane task of chores.

- **Colors**: Terracotta (#E07A5F), Sage (#81B29A), Cream (#F4F1DE), Charcoal (#3D405B)
- **Typography**: Outfit (display) + Merriweather (body)
- **Interactions**: Smooth animations, satisfying completion effects

## Contributing

This is a personal project, but feedback and suggestions are welcome! Please open an issue to discuss any ideas.

## License

See [LICENSE](./LICENSE) file for details.
