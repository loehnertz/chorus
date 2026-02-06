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

## Project Structure

The Next.js application lives in the `web/` directory:

```
chorus/                  # Repository root
├── web/                # Next.js application (work here!)
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── lib/           # Utilities and shared logic
│   ├── prisma/        # Database schema
│   └── ...
├── CLAUDE.md          # Development documentation
├── PLAN.md            # Implementation roadmap
└── README.md          # This file
```

**All development work happens in the `web/` directory.**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon account (for database and auth)
- Vercel CLI (optional, for environment sync)

### Development Setup

```bash
# Navigate to the web directory
cd web

# Install dependencies
npm install

# Link to Vercel project (optional, to pull environment variables)
vercel link
vercel env pull .env.development.local

# Or manually set up environment variables
cp .env .env.local
# Edit .env.local with your database and auth credentials

# Set up database and run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3001` to see the app.

### Common Commands

**Run all commands from the `web/` directory:**

```bash
cd web  # Always navigate here first!

# Development
npm run dev              # Start development server (port 3001)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run test             # Run unit tests
npm run type-check       # Run TypeScript checks

# Pre-commit workflow (ALWAYS run before committing)
npm run lint && npm run test && npm run build

# Database
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Regenerate Prisma Client
```

## Project Status

🚧 **In Active Development** - Phase 1 complete, ready for Phase 2

See [PLAN.md](./PLAN.md) for the complete implementation roadmap and architecture details.

**Phases**:
1. v0.1.0 - Foundation & Setup ✅
2. v0.2.0 - Authentication & User Management ⏳
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
