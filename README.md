<div align="center">
  <img src="web/public/icon.png" alt="Chorus icon" width="120" height="120" />

  # Chorus

  A chore tracking app for households with a cascading schedule system.

  Built for couples and small households who want chores to just get done without micromanaging a calendar.
</div>

<div align="center">
  <img src="web/public/screenshot.png" alt="Chorus app screenshot" width="900" />
</div>

## Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Design Philosophy](#design-philosophy)
- [Contributing](#contributing)
- [License](#license)

## Overview

Chorus organizes household chores by frequency — daily, weekly, monthly, yearly — and uses a **cascading schedule** to make sure everything gets done. The idea is simple: each frequency level automatically pulls in one chore from the next higher level.

- Each **day**: your daily chores + 1 weekly chore
- Each **week**: your weekly chores + 1 monthly chore
- Each **month**: your monthly chores + 1 yearly chore

This means 12 yearly chores naturally spread across the year (one per month), 4 monthly chores spread across the weeks, and so on. The system suggests which chore to pull in — prioritizing ones you haven't done in the longest time — but you can always override or pull in extra.

Everything ultimately lands on your **daily schedule**: you open the app, see what's on your plate today, and check things off.

**Deployment Model**: Each deployment represents a single household. All users share the same chore pool and can see each other's tasks.

## Key Features

- **Cascading schedule** - Higher-frequency chores automatically trickle down into your daily plan
- **Smart suggestions** - Algorithm suggests the most overdue chore to cascade next
- **Day-level scheduling** - One daily view as your single source of truth
- **Multi-user support** - Track who's assigned to what and who completed tasks
- **Personal dashboards** - Each user sees their assigned tasks and quick stats
- **Completion tracking** - Full history of who did what and when
- **Pace warnings** - Get notified if you're falling behind (e.g., too many yearly chores left for remaining months)
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

## Design Philosophy

**"Domestic Futurism"** - A refined, slightly retro-futuristic aesthetic that elevates the mundane task of chores.

- **Colors**: Terracotta (#E07A5F), Sage (#81B29A), Cream (#F4F1DE), Charcoal (#3D405B)
- **Typography**: Outfit (display) + Merriweather (body)
- **Interactions**: Smooth animations, satisfying completion effects

## Contributing

This is a personal project, but feedback and suggestions are welcome! Please open an issue to discuss any ideas.

## License

See [LICENSE](./LICENSE) file for details.
