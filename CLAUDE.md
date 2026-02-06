# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chorus** is a slot-based chore tracking web application for couples and households. The core innovation is a slot-based scheduling system where users can pull tasks from frequency pools (daily, weekly, monthly, yearly) into their schedule.

**Deployment Model**: Each deployment represents a single household - there is no multi-household support. All users in a deployment share the same chore pool. The application is designed to be deployed on Vercel.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Neon Auth (built on Better Auth)
- **Styling**: TailwindCSS + custom CSS variables
- **Animation**: Framer Motion
- **Deployment**: Vercel

## Common Commands

```bash
# Development
npm run dev              # Start development server (port 3000)
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma migrate dev   # Create and apply migrations
npx prisma db push       # Push schema changes without migrations
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Generate Prisma Client
npx prisma db seed       # Run seed script

# Code Quality
npm run lint             # Run ESLint
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run type-check       # Run TypeScript type checking

# Pre-commit workflow (ALWAYS run before committing)
npm run lint && npm run test && npm run build
```

## Architecture

### Slot-Based Scheduling System

The core architectural concept is that chores belong to frequency pools (DAILY, WEEKLY, MONTHLY, YEARLY), and users create "slots" that pull tasks from these pools:

- **Weekly Slot**: Can pull from DAILY or MONTHLY chore pools
- **Monthly Slot**: Can pull from YEARLY chore pool
- System suggests tasks based on least recently completed
- Users can manually override suggestions

### Key Models & Relationships

**Note**: No Household model - all chores are deployment-wide (single household per deployment).

```
User (extends Neon Auth)
  ├─ id (UUID from Neon Auth)
  ├─ assignedChores (ChoreAssignment[])
  └─ completions (ChoreCompletion[])

Chore (deployment-wide, shared by all users)
  ├─ frequency (DAILY | WEEKLY | MONTHLY | YEARLY)
  ├─ assignments (ChoreAssignment[])
  ├─ schedules (Schedule[])
  └─ completions (ChoreCompletion[])

Schedule (slot instance)
  ├─ chore (Chore)
  ├─ scheduledFor (DateTime)
  ├─ slotType (Frequency)
  ├─ suggested (boolean)
  └─ completions (ChoreCompletion[])
```

### Task Suggestion Algorithm

Located in `lib/suggestions.ts`, the algorithm prioritizes:
1. Never-completed tasks (highest priority)
2. Least recently completed tasks
3. User assignment matching
4. Slot type compatibility (respects frequency hierarchy)

### Directory Structure

- `app/(auth)/` - Authentication pages (sign-in, sign-up with Neon Auth UI)
- `app/(dashboard)/` - Protected dashboard routes with shared layout
- `app/api/auth/[...path]/` - Neon Auth API handlers
- `app/api/` - API routes for CRUD operations and task suggestions
- `components/ui/` - Reusable UI primitives
- `components/` - Feature-specific components (chore-card, slot-picker, etc.)
- `lib/auth/` - Neon Auth client/server instances
- `lib/` - Shared utilities (database client, suggestion algorithm)
- `types/auth.ts` - Neon Auth TypeScript types
- `middleware.ts` - Neon Auth route protection
- `prisma/` - Database schema and migrations

## Design Philosophy: "Domestic Futurism"

The UI aesthetic is defined by:

- **Color Palette**: Terracotta (#E07A5F), Sage (#81B29A), Cream (#F4F1DE), Charcoal (#3D405B)
- **Typography**: Outfit (display) + Merriweather (body)
- **Visual Style**: Card-based layouts, organic rounded corners, generous spacing
- **Animations**: Smooth 200-300ms transitions, celebration effects on completion

When creating UI components, reference the CSS variables defined in `app/globals.css`:
- `--color-terracotta`, `--color-sage`, `--color-cream`, `--color-charcoal`
- `--font-display`, `--font-body`
- `--radius-sm/md/lg`, `--shadow-soft/lifted`

## Database Patterns

### Schema Organization
- App schema: Contains User, Chore, Schedule, ChoreCompletion, ChoreAssignment
- `neon_auth` schema: Managed by Neon Auth, contains authentication tables (users, sessions, accounts)
- User model in app schema uses UUID `id` synced from Neon Auth (no `@default`, managed externally)
- No Household model - all chores are deployment-wide

### Creating Chores
Chores are deployment-wide and visible to all users. Frequency is an enum (DAILY, WEEKLY, MONTHLY, YEARLY). Use `@default(uuid())` for chore IDs.

### Scheduling Flow
1. Create Schedule with `slotType` and `scheduledFor`
2. System generates suggestion via `/api/schedules/suggest`
3. User can accept or manually pick different chore
4. On completion, create ChoreCompletion linking schedule and user

### Cascading Deletes
- Deleting a User cascades to ChoreAssignments and ChoreCompletions
- Deleting a Chore cascades to ChoreAssignments, Schedules, and ChoreCompletions
- Deleting a Schedule sets ChoreCompletion.scheduleId to null (SetNull)

## Authentication Flow

Neon Auth is configured via two files:
- `lib/auth/server.ts` - Server-side auth instance using `createNeonAuth()`
- `lib/auth/client.ts` - Client-side auth instance for React components

**Key patterns**:
- Neon Auth managed service (stores auth data in `neon_auth` schema)
- Session-based authentication with Better Auth SDK
- Email/password and OAuth (Google) providers configured in Neon dashboard
- Protected routes via `middleware.ts` using `auth.middleware()`
- API route protection via `auth.getSession()` - check for `session?.user`
- User sync: On first Neon Auth login, create corresponding User record in app schema
- Database branching: Auth state branches with database for preview environments

**Session access**:
- Server Components: `const { data: session } = await auth.getSession()`
- Client Components: `const session = authClient.useSession()`
- API Routes: `const { data: session } = await auth.getSession()`

## API Conventions

All API routes follow RESTful patterns and require authentication:
- `GET /api/chores` - List all chores (deployment-wide, no household filtering)
- `POST /api/chores` - Create new chore
- `GET /api/chores/[id]` - Get single chore
- `PUT /api/chores/[id]` - Update chore
- `DELETE /api/chores/[id]` - Delete chore

Special endpoints:
- `POST /api/schedules/suggest` - Get suggested task for a slot type (body: `{ slotType, userId? }`)
- `POST /api/completions` - Record task completion

**Authentication pattern for API routes**:
```typescript
const { data: session } = await auth.getSession();
if (!session?.user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
// ... handle authenticated request
```

## Environment Setup

Required environment variables (see `.env.example`):
```
DATABASE_URL="postgresql://..."
NEON_AUTH_BASE_URL="https://auth.neon.tech/..."  # From Neon console
NEON_AUTH_COOKIE_SECRET="generated-secret"        # Generate: openssl rand -base64 32
# OAuth providers configured in Neon Auth dashboard (no env vars needed)
```

**Vercel Deployment**: The application is designed to deploy on Vercel. Set environment variables in Vercel dashboard and ensure `DATABASE_URL` points to your Neon production database.

## Testing Requirements

**CRITICAL**: Unit tests are required for essentially every feature. Before implementing any feature, write tests first (TDD approach).

### Unit Testing
- Test framework: Jest + React Testing Library
- Write unit tests for all utility functions (`lib/suggestions.ts`, `lib/utils.ts`)
- Write component tests for all React components
- Write API route tests for all endpoints
- Test coverage target: >80%

### Test Organization
- `__tests__/` directory mirrors source structure
- `lib/__tests__/` for utility tests
- `components/__tests__/` for component tests
- `app/api/__tests__/` for API route tests

### Pre-Commit Workflow
**ALWAYS run before committing code:**
```bash
npm run lint && npm run test && npm run build
```
All three must pass before creating a commit. No exceptions.

### Manual Verification
In addition to automated tests, verify:
1. **Database integrity**: Use `npx prisma studio` to verify relationships and User sync from Neon Auth
2. **Completion flow**: Create chore → schedule → complete → verify ChoreCompletion
3. **Suggestion algorithm**: Test that least-recent and never-completed tasks surface correctly
4. **Multi-user**: Create second user, verify deployment-wide chore sharing and separate dashboards
5. **Responsive**: Test on mobile viewport, ensure touch-friendly interactions
6. **Auth flow**: Sign up → User record created → sign out → sign in → session restored

## Implementation Status

This project is in early development. Refer to PLAN.md for the phased implementation roadmap with semantic versioning:
1. v0.1.0 - Foundation & Setup (Next.js, testing, UI components)
2. v0.2.0 - Authentication & User Management (Neon Auth integration)
3. v0.3.0 - Basic CRUD APIs (chores, completions)
4. v0.4.0 - Suggestion Algorithm & Schedules
5. v0.5.0 - Dashboard & Main UI
6. v0.6.0 - Schedule System & Calendar
7. v1.0.0 - Polish & Production Release

## Key Considerations

- **Testing**: Write unit tests for every feature BEFORE implementation (TDD). Always run lint → test → build before committing
- **Performance**: Use server components by default; only mark 'use client' when needed for interactivity
- **Accessibility**: Large touch targets (min 44x44px), semantic HTML, keyboard navigation
- **Mobile-first**: Design for mobile viewport first, then enhance for desktop
- **Animation performance**: Use transform and opacity for animations (GPU-accelerated)
- **Data consistency**: No household isolation - all chores are deployment-wide and shared
- **Auth Integration**: User model in app schema extends Neon Auth user (UUID id); sync on first login
- **Deployment**: Application designed for Vercel; leverage serverless functions and edge runtime where appropriate

## Development Guidelines

**Flexibility**: You are encouraged to suggest improvements or alterations to PLAN.md if you discover better approaches during implementation. The plan is a guide, not a strict contract.

**Communication**: Ask plenty of questions when you need:
- Clarification on requirements or user intent
- Direction on architectural decisions
- Confirmation before making significant changes
- Feedback on proposed alternatives

Don't hesitate to use the AskUserQuestion tool liberally - it's better to clarify than to make assumptions.
