# Chore Tracker Web Application - Implementation Plan

## Context

Building a shared chore tracking web application for couples/households to manage recurring tasks across different time frequencies (daily, weekly, monthly, yearly). The key innovation is a **slot-based scheduling system** where users can pull tasks from frequency pools into their schedule - for example, picking a yearly deep-cleaning task to tackle during a monthly slot.

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
- **Database**: PostgreSQL (Neon-compatible)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: TailwindCSS + custom CSS variables
- **Animation**: Framer Motion
- **Deployment**: Vercel-ready

### Database Schema

```prisma
// User model
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]

  householdId   String?
  household     Household? @relation(fields: [householdId], references: [id])

  assignedChores ChoreAssignment[]
  completions    ChoreCompletion[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// Household (shared space for multiple users)
model Household {
  id        String   @id @default(cuid())
  name      String
  members   User[]
  chores    Chore[]
  schedules Schedule[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Chore definition (the pool of tasks)
model Chore {
  id          String   @id @default(cuid())
  title       String
  description String?
  frequency   Frequency // DAILY, WEEKLY, MONTHLY, YEARLY

  householdId String
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)

  assignments ChoreAssignment[]
  schedules   Schedule[]
  completions ChoreCompletion[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Assignment of chore to a user
model ChoreAssignment {
  id      String @id @default(cuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  choreId String
  chore   Chore  @relation(fields: [choreId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, choreId])
}

// Scheduled instance (slot-based system)
model Schedule {
  id          String    @id @default(cuid())
  choreId     String
  chore       Chore     @relation(fields: [choreId], references: [id], onDelete: Cascade)

  householdId String
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)

  scheduledFor DateTime  // When this task should be done
  slotType     Frequency // What kind of slot (WEEKLY, MONTHLY, etc)
  suggested    Boolean @default(true) // Was this auto-suggested or manually selected

  completions ChoreCompletion[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Completion record
model ChoreCompletion {
  id          String   @id @default(cuid())
  choreId     String
  chore       Chore    @relation(fields: [choreId], references: [id], onDelete: Cascade)

  scheduleId  String?
  schedule    Schedule? @relation(fields: [scheduleId], references: [id], onDelete: SetNull)

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

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Project Structure

```
chore-tracker/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout with nav
│   │   ├── page.tsx                # Personal dashboard
│   │   ├── schedule/
│   │   │   └── page.tsx            # Schedule/calendar view
│   │   ├── chores/
│   │   │   ├── page.tsx            # Chore pool management
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Edit chore
│   │   └── household/
│   │       └── page.tsx            # Household settings
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
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
│   ├── auth.ts                     # NextAuth configuration
│   ├── db.ts                       # Prisma client
│   ├── suggestions.ts              # Task suggestion algorithm
│   └── utils.ts                    # Utility functions
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── fonts/
├── types/
│   └── index.ts
├── .env.example
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Implementation Phases

### Phase 1: Project Setup & Foundation
1. Copy this plan to `/Users/loehnertz/Projects/Personal/chore-tracker-plan.md`
2. Initialize Next.js project with TypeScript
3. Install dependencies (Prisma, NextAuth, Framer Motion, TailwindCSS)
4. Set up Prisma with schema
5. Configure NextAuth with credentials provider (or Google OAuth)
6. Create base layout and theme system (CSS variables)
7. Set up custom fonts (Outfit, Merriweather)

### Phase 2: Authentication & User Management
1. Implement NextAuth configuration
2. Create login/signup pages with the aesthetic
3. Build household creation/joining flow
4. Add protected route middleware
5. Create user context/session management

### Phase 3: Core Data Layer & API
1. Implement Prisma client setup
2. Create API routes for:
   - Chores CRUD
   - Schedule management
   - Completion tracking
3. Build task suggestion algorithm:
   - Check last completion dates
   - Suggest tasks from appropriate frequency pools
   - Allow manual override

### Phase 4: Dashboard & Main UI
1. Build personal dashboard:
   - "Today's Tasks" section
   - "Your Assigned Chores" section
   - Quick stats (completion streaks, etc.)
2. Create chore pool management page:
   - Separate views for each frequency
   - Add/edit/delete chores
   - Assign to users
3. Implement completion flow with animations

### Phase 5: Schedule System
1. Build calendar/schedule view
2. Implement slot creation:
   - Weekly slots → pull from daily/monthly pools
   - Monthly slots → pull from yearly pool
3. Create slot picker UI with suggestions
4. Add drag-and-drop or selection interface

### Phase 6: Polish & Refinement
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
  householdId: string,
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

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## Verification & Testing

### End-to-End Testing Flow
1. **Setup**:
   - Create account / login
   - Create or join household

2. **Chore Management**:
   - Add chores in each frequency category (daily, weekly, monthly, yearly)
   - Assign chores to users
   - Edit and delete chores

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
   - Invite second user to household
   - Assign chores to different people
   - Verify each user sees their own dashboard
   - Verify both can see and complete shared tasks

7. **Responsive**:
   - Test on mobile device
   - Verify all interactions work on touch
   - Verify layout adapts properly

### Database Verification
```bash
# After seeding
npx prisma studio

# Check:
# - Users are created with household relationship
# - Chores are categorized correctly
# - Schedules reference chores properly
# - Completions are recorded with timestamps
```

### Visual Verification
- Typography loads correctly (Outfit, Merriweather)
- Color scheme matches (terracotta, sage, cream, charcoal)
- Animations are smooth and performant
- Mobile layout doesn't break
- Checkboxes are large and touch-friendly

## Deployment Preparation

1. Set up Neon PostgreSQL database
2. Configure environment variables in Vercel
3. Run migrations: `npx prisma migrate deploy`
4. Deploy to Vercel
5. Test production authentication flow
6. Verify database connections

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
