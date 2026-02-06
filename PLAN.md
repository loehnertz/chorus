# Chore Tracker Web Application - Implementation Plan

## Context

Building a shared chore tracking web application for couples/households to manage recurring tasks across different time frequencies (daily, weekly, monthly, yearly). The key innovation is a **slot-based scheduling system** where users can pull tasks from frequency pools into their schedule - for example, picking a yearly deep-cleaning task to tackle during a monthly slot.

**Deployment Model**: Each deployment represents a single household. There is no multi-household support - all users in a deployment share the same chore pool and can see each other's tasks.

The app needs to support:
- Multi-user authentication with personal dashboards
- Task assignment to specific people
- Intelligent task suggestions with manual override capability
- Completion tracking and history
- Responsive, mobile-friendly interface

## Design Philosophy: "Domestic Futurism"

A refined, slightly retro-futuristic aesthetic that elevates the mundane task of chores:
- **Color Palette**: Warm terracotta (#E07A5F), sage green (#81B29A), cream (#F4F1DE), charcoal (#3D405B)
- **Typography**: Geometric display font (Outfit) + warm serif (Merriweather) for body
- **Visual Style**: Card-based layouts, generous spacing, organic rounded corners, subtle shadows
- **Interactions**: Smooth, satisfying animations on task completion, staggered reveals

## Technical Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Neon Auth (built on Better Auth)
- **Styling**: TailwindCSS + custom CSS variables
- **Animation**: Framer Motion
- **Deployment**: Vercel-ready

### Database Schema

```prisma
// User model (extends Neon Auth user)
// Note: Auth data (email, password, sessions) lives in neon_auth schema
model User {
  id    String @id  // UUID from Neon Auth (no @default, synced from auth)
  name  String?
  image String?

  assignedChores ChoreAssignment[]
  completions    ChoreCompletion[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// Chore definition (the pool of tasks)
// Note: All chores are shared across the deployment (single household model)
model Chore {
  id          String    @id @default(uuid())
  title       String
  description String?
  frequency   Frequency // DAILY, WEEKLY, MONTHLY, YEARLY

  assignments ChoreAssignment[]
  schedules   Schedule[]
  completions ChoreCompletion[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Assignment of chore to a user
model ChoreAssignment {
  id      String @id @default(uuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  choreId String
  chore   Chore  @relation(fields: [choreId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, choreId])
}

// Scheduled instance (slot-based system)
model Schedule {
  id           String    @id @default(uuid())
  choreId      String
  chore        Chore     @relation(fields: [choreId], references: [id], onDelete: Cascade)

  scheduledFor DateTime  // When this task should be done
  slotType     Frequency // What kind of slot (WEEKLY, MONTHLY, etc)
  suggested    Boolean   @default(true) // Was this auto-suggested or manually selected

  completions ChoreCompletion[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Completion record
model ChoreCompletion {
  id         String    @id @default(uuid())
  choreId    String
  chore      Chore     @relation(fields: [choreId], references: [id], onDelete: Cascade)

  scheduleId String?
  schedule   Schedule? @relation(fields: [scheduleId], references: [id], onDelete: SetNull)

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  completedAt DateTime @default(now())
  notes       String?
}

enum Frequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}
```

**Note**: Authentication tables (users, sessions, accounts, verification tokens) are managed by Neon Auth in the `neon_auth` schema. Our app schema only includes the User model extension for chore relationships. All chores are shared across the deployment (no household isolation).

## Project Structure

```
chore-tracker/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx            # Sign in page (Neon Auth UI)
│   │   └── sign-up/
│   │       └── page.tsx            # Sign up page (Neon Auth UI)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout with nav
│   │   ├── page.tsx                # Personal dashboard
│   │   ├── schedule/
│   │   │   └── page.tsx            # Schedule/calendar view
│   │   ├── chores/
│   │   │   ├── page.tsx            # Chore pool management
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Edit chore
│   │   └── settings/
│   │       └── page.tsx            # User settings (profile, preferences)
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...path]/
│   │   │       └── route.ts        # Neon Auth handlers
│   │   ├── chores/
│   │   │   ├── route.ts            # CRUD operations
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── schedules/
│   │   │   ├── route.ts
│   │   │   └── suggest/
│   │   │       └── route.ts        # Task suggestion algorithm
│   │   └── completions/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   └── input.tsx
│   ├── chore-card.tsx              # Individual chore display
│   ├── chore-form.tsx              # Create/edit chore
│   ├── completion-modal.tsx        # Task completion celebration
│   ├── dashboard-stats.tsx         # Stats widget
│   ├── frequency-badge.tsx         # Visual frequency indicator
│   ├── schedule-calendar.tsx       # Calendar view
│   ├── slot-picker.tsx             # Pick task from pool UI
│   └── user-avatar.tsx
├── lib/
│   ├── auth/
│   │   ├── server.ts               # Neon Auth server instance
│   │   └── client.ts               # Neon Auth client instance
│   ├── db.ts                       # Prisma client
│   ├── suggestions.ts              # Task suggestion algorithm
│   └── utils.ts                    # Utility functions
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── fonts/
├── types/
│   ├── auth.ts                     # Neon Auth session types
│   └── index.ts                    # General types
├── middleware.ts                   # Neon Auth route protection
├── .env.example
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Implementation Phases

### Phase 1: Project Setup & Foundation (v0.1.0)
1. Initialize Next.js project with TypeScript
2. Install dependencies (Prisma, Better Auth SDK, Framer Motion, TailwindCSS)
3. Set up Neon database and enable Neon Auth
4. Set up Prisma with schema
5. Initialize Neon Auth client and configure providers
6. Create base layout and theme system (CSS variables)
7. Set up custom fonts (Outfit, Merriweather)

### Phase 2: Authentication & User Management (v0.2.0)
1. Create Neon Auth server instance (`lib/auth/server.ts`)
2. Create Neon Auth client instance (`lib/auth/client.ts`)
3. Set up auth API handlers (`app/api/auth/[...path]/route.ts`)
4. Configure middleware for route protection (`middleware.ts`)
5. Create sign-in/sign-up pages with Neon Auth UI components
6. Set up user sync: On first login, create User record from Neon Auth user
7. Define TypeScript types for sessions (`types/auth.ts`)

### Phase 3: Core Data Layer & API (v0.3.0)
1. Implement Prisma client setup
2. Create API routes for:
   - Chores CRUD
   - Schedule management
   - Completion tracking
3. Build task suggestion algorithm:
   - Check last completion dates
   - Suggest tasks from appropriate frequency pools
   - Allow manual override

### Phase 4: Dashboard & Main UI (v0.4.0)
1. Build personal dashboard:
   - "Today's Tasks" section
   - "Your Assigned Chores" section
   - Quick stats (completion streaks, etc.)
2. Create chore pool management page:
   - Separate views for each frequency
   - Add/edit/delete chores
   - Assign to users
3. Implement completion flow with animations

### Phase 5: Schedule System (v0.5.0)
1. Build calendar/schedule view
2. Implement slot creation:
   - Weekly slots → pull from daily/monthly pools
   - Monthly slots → pull from yearly pool
3. Create slot picker UI with suggestions
4. Add drag-and-drop or selection interface

### Phase 6: Polish & Refinement (v1.0.0)
1. Add animations with Framer Motion:
   - Page transitions
   - Completion celebrations
   - Staggered reveals
2. Mobile responsive refinements
3. Loading states and error handling
4. Add completion history view
5. Performance optimization

## Key Features Implementation Details

### Task Suggestion Algorithm (`lib/suggestions.ts`)
```typescript
// Suggest tasks based on:
// 1. Least recently completed
// 2. Never completed tasks (priority)
// 3. User assignment
// 4. Slot type (weekly slot can only pull certain frequencies)

function suggestTask(
  slotType: Frequency,
  userId?: string
): Promise<Chore>
```

### Slot System Rules
- **Weekly Slot**: Can pull from DAILY or MONTHLY chore pools
- **Monthly Slot**: Can pull from YEARLY chore pool
- Users can manually override suggestions
- System tracks when each pool task was last completed

### Completion Flow
1. User clicks checkbox on task
2. Animated celebration modal appears
3. Record completion in database
4. Update schedule if it was a scheduled task
5. Refresh dashboard with new suggestions

## Styling Approach

### Custom CSS Variables (globals.css)
```css
:root {
  --color-terracotta: #E07A5F;
  --color-sage: #81B29A;
  --color-cream: #F4F1DE;
  --color-charcoal: #3D405B;
  --color-warm-white: #F8F7F4;

  --font-display: 'Outfit', sans-serif;
  --font-body: 'Merriweather', serif;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;

  --shadow-soft: 0 4px 12px rgba(61, 64, 91, 0.08);
  --shadow-lifted: 0 8px 24px rgba(61, 64, 91, 0.12);
}
```

### Animation Philosophy
- **Page Load**: Staggered fade-in-up for cards (100ms delay between each)
- **Completion**: Confetti burst + scale animation + sound effect (optional)
- **Hover**: Subtle lift (translateY(-2px)) + shadow increase
- **Transitions**: 200-300ms ease-out for most interactions

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Neon Auth (from Neon console)
NEON_AUTH_BASE_URL="https://auth.neon.tech/..."  # Your Neon Auth URL
NEON_AUTH_COOKIE_SECRET="generated-secret-key"    # Generate with: openssl rand -base64 32

# OAuth providers configured in Neon Auth dashboard
# (No client IDs/secrets needed in env - managed by Neon Auth)
```

## Verification & Testing

### End-to-End Testing Flow
1. **Authentication**:
   - Sign up with email/password
   - Sign out and sign back in
   - Verify User record created in database

2. **Chore Management**:
   - Add chores in each frequency category (daily, weekly, monthly, yearly)
   - Assign chores to users
   - Edit and delete chores
   - Verify all users can see all chores (shared deployment)

3. **Dashboard**:
   - View personal dashboard
   - See assigned tasks
   - Check shared/unassigned tasks

4. **Completion Flow**:
   - Complete a daily task
   - Complete a scheduled task from a slot
   - Verify completion appears in history
   - Verify completion count updates

5. **Schedule System**:
   - Navigate to schedule view
   - Create a weekly slot
   - System suggests task from daily/monthly pool
   - Manually override and pick different task
   - Create monthly slot
   - System suggests yearly task
   - Complete scheduled task

6. **Multi-User**:
   - Create second user account
   - Assign chores to different people
   - Verify each user sees their own dashboard
   - Verify both can see and complete all chores (deployment-wide sharing)
   - Verify completion tracking per user

7. **Responsive**:
   - Test on mobile device
   - Verify all interactions work on touch
   - Verify layout adapts properly

### Database Verification
```bash
# After seeding
npx prisma studio

# Check:
# - Users synced from Neon Auth (id, name, image)
# - Chores are categorized correctly by frequency
# - Schedules reference chores properly
# - Completions are recorded with timestamps and user attribution
# - ChoreAssignments link users to chores correctly
```

### Visual Verification
- Typography loads correctly (Outfit, Merriweather)
- Color scheme matches (terracotta, sage, cream, charcoal)
- Animations are smooth and performant
- Mobile layout doesn't break
- Checkboxes are large and touch-friendly

## Deployment Preparation

**Target Platform**: Vercel (the application is specifically designed for Vercel deployment)

1. Set up Neon PostgreSQL database with Neon Auth enabled
2. Configure OAuth providers in Neon Auth dashboard
3. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL` - Neon production database URL
   - `NEON_AUTH_BASE_URL` - Neon Auth URL from console
   - `NEON_AUTH_COOKIE_SECRET` - Generated secret (openssl rand -base64 32)
4. Run migrations: `npx prisma migrate deploy`
5. Deploy to Vercel
6. Test production authentication flow (Neon Auth handles auth state branching)
7. Verify database connections and user sync

## Future Enhancements (Out of Scope)
- Push notifications for task reminders
- Gamification (points, streaks, rewards)
- Recurring task auto-scheduling
- Integration with calendar apps
- Photo attachments for completed tasks
- Analytics dashboard
- Multi-household support per user

---

**Estimated Development Time**: 12-16 hours for core functionality + polish
**Complexity**: Medium - well-defined requirements with some algorithmic complexity in the suggestion system
