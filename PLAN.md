# Chore Tracker Web Application - Implementation Plan

## Context

Building a shared chore tracking web application for couples/households to manage recurring tasks across different time frequencies (daily, weekly, monthly, yearly). The key innovation is a **cascading schedule system** where each frequency level includes one chore pulled down from the next higher level — for example, each month includes one yearly chore, so all yearly chores get distributed across the year.

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
  slotType     Frequency // The frequency level this schedule belongs to
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
chorus/
├── web/                # Next.js application
│   ├── app/            # App Router (pages, layouts, API routes)
│   ├── components/     # React components (ui/, feature components)
│   ├── lib/            # Utilities (auth/, db, suggestions)
│   ├── prisma/         # Schema and migrations
│   ├── types/          # TypeScript type definitions
│   └── public/         # Static assets
├── CLAUDE.md
├── PLAN.md
└── README.md
```

## Implementation Phases

### Phase 1: Foundation & Setup (v0.1.0)
1. Initialize Next.js project with TypeScript
2. Install dependencies:
   - Core: Prisma, Neon Auth SDK, TailwindCSS, Framer Motion
   - Testing: Jest, React Testing Library, @testing-library/jest-dom
3. Set up Neon database and enable Neon Auth
4. Configure Prisma with schema and generate client
5. Set up testing infrastructure:
   - Configure Jest with Next.js
   - Create test utilities and helpers
   - Add test scripts to package.json
6. Build custom UI component library (`components/ui/`):
   - Button, Card, Checkbox, Dialog, Input
   - Use Radix UI primitives for accessibility (headless components)
   - Style with TailwindCSS to match "Domestic Futurism" aesthetic
7. Create base layout and theme system (CSS variables in `globals.css`)
8. Set up custom fonts (Outfit, Merriweather)

### Phase 2: Authentication & User Management (v0.2.0) ✅ COMPLETED
1. Create Neon Auth server instance (`lib/auth/server.ts`)
2. Create Neon Auth client instance (`lib/auth/client.ts`)
3. Set up auth API handlers (`app/api/auth/[...path]/route.ts`)
4. Configure middleware for route protection (`middleware.ts`)
5. Define TypeScript types for sessions (`types/auth.ts`)
6. Create sign-in/sign-up pages with Neon Auth UI components
7. Implement user sync: On first login, create User record from Neon Auth
8. Implement approval system: Users created with `approved: false`, require admin approval
9. Create `requireApprovedUser()` utility for data access control
10. Write tests for auth utilities and user sync logic
11. Verify auth flow end-to-end (signup → approval → login → session)
12. Write phase summary document: `web/docs/PHASE_2_SUMMARY.md`

### Phase 3: Basic CRUD APIs (v0.3.0)
1. Implement Prisma client setup (`lib/db.ts`)
2. Create Chores API routes:
   - `GET /api/chores` - List all chores
   - `POST /api/chores` - Create chore
   - `GET /api/chores/[id]` - Get single chore
   - `PUT /api/chores/[id]` - Update chore
   - `DELETE /api/chores/[id]` - Delete chore
   - **IMPORTANT**: All routes must use `requireApprovedUser()` for approval checking
3. Create ChoreAssignment API routes:
   - `POST /api/chores/[id]/assignments` - Assign chore to user
   - `DELETE /api/chores/[id]/assignments/[userId]` - Unassign chore from user
   - **IMPORTANT**: All routes must use `requireApprovedUser()` for approval checking
4. Create Completions API routes:
   - `POST /api/completions` - Record completion
   - `GET /api/completions` - List completions (with filters)
   - **IMPORTANT**: All routes must use `requireApprovedUser()` for approval checking
5. Add input validation with Zod:
   - Define Zod schemas for all API request bodies
   - Validate chore creation/update payloads (title required, valid frequency, etc.)
   - Validate completion payloads (valid choreId, optional notes, etc.)
   - Return structured validation errors in API responses
6. Write API route tests for all endpoints
7. Create seed script (`prisma/seed.ts`) with sample data
8. Test CRUD operations with Prisma Studio
9. Write phase summary document: `web/docs/PHASE_3_SUMMARY.md`

### Phase 4: Suggestion Algorithm & Schedules (v0.4.0)
1. Build task suggestion algorithm (`lib/suggestions.ts`):
   - Prioritize never-completed tasks
   - Sort by least recently completed
   - Respect user assignments
   - Cascade one level only (daily←weekly, weekly←monthly, monthly←yearly)
2. Write comprehensive tests for suggestion algorithm
3. Create Schedules API routes:
   - `GET /api/schedules` - List schedules
   - `POST /api/schedules` - Create schedule
   - `POST /api/schedules/suggest` - Get suggested task for slot
   - `DELETE /api/schedules/[id]` - Delete schedule
4. Write API route tests for schedules
5. Test suggestion algorithm with various scenarios

### Phase 5: Dashboard & Main UI (v0.5.0)

Phase 5 builds the entire dashboard shell and the chore management UI. It introduces the navigation system, new UI primitives, feature components, page layouts, and wires them to the CRUD APIs from Phase 3.

#### 5.1 New UI Primitives (`components/ui/`)

All primitives must use `cn()` for class merging and accept a `className` prop for overrides.

##### 5.1.1 FrequencyBadge (`components/ui/frequency-badge.tsx`)
Small pill showing chore frequency. Used everywhere chores appear.

```
Props:  frequency: Frequency, className?: string
Shape:  rounded-full  px-3  py-1  text-xs  font-medium  font-[var(--font-display)]  uppercase  tracking-wide  border

Variants by frequency:
  DAILY    → bg-[var(--color-terracotta)]/15  text-[var(--color-terracotta)]  border-[var(--color-terracotta)]/30
  WEEKLY   → bg-[var(--color-sage)]/15        text-[var(--color-sage)]        border-[var(--color-sage)]/30
  MONTHLY  → bg-[var(--color-charcoal)]/10    text-[var(--color-charcoal)]    border-[var(--color-charcoal)]/20
  YEARLY   → bg-[var(--color-cream)]          text-[var(--color-charcoal)]    border-[var(--color-charcoal)]/20
```

Each frequency should feel visually distinct at a glance. Daily is warm/urgent (terracotta tint), weekly is calm/routine (sage tint), monthly/yearly are neutral.

##### 5.1.2 Select (`components/ui/select.tsx`)
Build on `@radix-ui/react-select`. Match Input styling: h-11, 2px charcoal/20 border, terracotta focus ring. Dropdown menu: `--radius-md`, `--shadow-lifted`, white bg, items highlight with `bg-[var(--color-cream)]` on hover.

##### 5.1.3 Textarea (`components/ui/textarea.tsx`)
Multi-line Input variant: same border, focus ring, padding, radius. Min-height 100px. Used for chore descriptions and completion notes.

##### 5.1.4 Skeleton (`components/ui/skeleton.tsx`)
Loading placeholder with shimmer animation:
```
Base: bg-[var(--color-cream)]  rounded-[var(--radius-md)]  animate-pulse
Variants:
  SkeletonText   → h-4, various widths (w-full, w-3/4, w-1/2)
  SkeletonCard   → full card shape (height ~160px)
  SkeletonCircle → rounded-full (for avatars), size variants matching Avatar
```

##### 5.1.5 Toast / Notification
Use `sonner` library. Position: bottom-center on mobile, bottom-right on desktop.
```
Style: bg-white  rounded-[var(--radius-md)]  shadow-[var(--shadow-lifted)]  border border-[var(--color-cream)]
       p-4  font-[var(--font-display)]  text-sm
Variants (left accent border, 4px):
  Success → border-l-[var(--color-sage)]
  Error   → border-l-red-500
  Info    → border-l-[var(--color-charcoal)]
Auto-dismiss: 4s with smooth slide-out animation.
```

##### 5.1.6 EmptyState (`components/ui/empty-state.tsx`)
Centered placeholder for empty lists.
```
Container:  flex flex-col items-center justify-center  py-16  text-center
Icon:       48px, stroke-[var(--color-charcoal)]/30, stroke-width 1.5 (Lucide icons)
Title:      text-lg font-[var(--font-display)] font-medium text-[var(--color-charcoal)]/70  mt-4
Subtitle:   text-sm text-[var(--color-charcoal)]/50  mt-1  max-w-xs
CTA:        <Button variant="outline" size="sm">  mt-4  (optional)

Props: icon: LucideIcon, title: string, subtitle?: string, ctaLabel?: string, onCtaClick?: () => void, className?: string
```

##### 5.1.7 Avatar (`components/ui/avatar.tsx`)
Circle showing first letter of user name on a colored background. Deterministic color from palette based on user ID (hash to pick from terracotta/sage/charcoal).
```
Size variants: sm (28px), md (36px), lg (48px)
Always: rounded-full, font-[var(--font-display)], font-semibold, text-white
Props: name: string, userId: string, size?: 'sm' | 'md' | 'lg', className?: string
```

#### 5.2 Navigation Shell

##### 5.2.1 Sidebar (`components/sidebar.tsx`) — Desktop (md: 768px+)
Fixed left, w-64.
```
┌────────────────────┐
│  🎵 Chorus         │  ← Logo: font-display, text-xl, font-bold, terracotta
│                    │
│  ▸ Dashboard       │  ← Active: bg-[var(--color-cream)] text-[var(--color-charcoal)]
│    Chores          │     Inactive: text-[var(--color-charcoal)]/60 hover:bg-[var(--color-cream)]/50
│    Schedule        │
│                    │
│  ─────────────     │  ← Divider: border-[var(--color-cream)]
│                    │
│  👤 Alice          │  ← Avatar + name at bottom
│     Sign Out       │     text-xs, charcoal/50, hover:terracotta
└────────────────────┘

Nav item styling:
  flex items-center gap-3  px-3 py-2.5  rounded-[var(--radius-md)]
  text-sm font-[var(--font-display)] font-medium  transition-colors duration-150
  Active indicator: bg-[var(--color-cream)] OR 3px left border in terracotta

Lucide icons (20px, stroke-width 1.5):
  Dashboard → LayoutDashboard, Chores → ClipboardList, Schedule → CalendarDays
```

##### 5.2.2 BottomBar (`components/bottom-bar.tsx`) — Mobile (< md:)
Fixed bottom, h-16.
```
flex justify-around items-center  bg-white  border-t border-[var(--color-cream)]
shadow-[0_-2px_8px_rgba(61,64,91,0.06)]

Each tab: flex flex-col items-center gap-0.5
  Icon (20px) + label (text-[10px] font-display)
  Active: terracotta icon + text
  Inactive: charcoal/40 icon + text
```

##### 5.2.3 DashboardLayout (`app/(dashboard)/layout.tsx`)
Page shell wrapping all dashboard routes.
```tsx
<div className="min-h-screen bg-[var(--color-warm-white)]">
  <Sidebar />      {/* hidden below md: */}
  <main className="md:ml-64 pb-20 md:pb-0">
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {children}
    </div>
  </main>
  <BottomBar />    {/* hidden at md: and above */}
</div>
```

#### 5.3 Feature Components (`components/`)

##### 5.3.1 ChoreCard (`components/chore-card.tsx`)
Primary unit for displaying a chore. Used in chore pool list and dashboard.
```
Layout:
┌─────────────────────────────────────────────┐
│  [FrequencyBadge]                    [···]  │  ← header: flex items-center justify-between mb-3
│                                             │
│  Chore Title                                │  ← font-display, text-lg, font-semibold, charcoal
│  Description clipped to 2 lines...          │  ← font-body, text-sm, charcoal/70, line-clamp-2, mt-1
│                                             │
│  👤 Assigned: Alice, Bob          3 done    │  ← footer: avatars + completion count
└─────────────────────────────────────────────┘

Card:    bg-white  rounded-[var(--radius-lg)]  p-5  shadow-[var(--shadow-soft)]
         hover:shadow-[var(--shadow-lifted)]  transition-shadow duration-200
         border border-transparent hover:border-[var(--color-cream)]  cursor-pointer
Footer:  flex items-center justify-between  mt-4  pt-3  border-t border-[var(--color-cream)]
         text-xs  text-[var(--color-charcoal)]/60
Assignees: flex -space-x-1.5  (overlapping Avatar sm)
Menu:    Ghost button, MoreHorizontal icon, opens dropdown for Edit/Delete

Framer Motion entrance: initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
Staggered delays in lists (0.05s between items).
```

##### 5.3.2 ChoreForm (`components/chore-form.tsx`) — Dialog-based
Modal form for creating/editing chores. Opens inside a Dialog.
```
Fields (vertical stack, space-y-4):
  1. Title       → Input, required, placeholder "e.g., Vacuum the living room"
  2. Description → Textarea, optional, placeholder "Add details or notes..."
  3. Frequency   → Select with 4 options (Daily/Weekly/Monthly/Yearly), each shows FrequencyBadge inline
  4. Assignees   → Multi-select checkboxes showing Avatar + name
                   Wrapped in: rounded-[var(--radius-md)] border border-[var(--color-charcoal)]/10 p-3

Footer:
  Cancel (ghost) + Save (primary)
  flex justify-between on mobile, justify-end with gap-3 on desktop

Validation:
  Inline errors below each field: text-sm text-red-600 mt-1
  Disabled submit button while loading
  Toast on success ("Chore created!" / "Chore updated!")
```

##### 5.3.3 DashboardStats (`components/dashboard-stats.tsx`)
Row of stat cards at the top of the dashboard.
```
Container:  grid grid-cols-2 md:grid-cols-4  gap-4

Each stat card:
┌──────────────────────┐
│  Label               │  ← text-xs uppercase tracking-wide font-display charcoal/50
│  42                  │  ← text-3xl font-display font-bold charcoal
│  +3 this week        │  ← text-xs sage (positive) or charcoal/50 (neutral)
└──────────────────────┘

Card: bg-white  rounded-[var(--radius-md)]  p-4  shadow-[var(--shadow-soft)]  border border-[var(--color-cream)]

Stats: "Completed" (total), "This Week" (weekly), "Streak" (consecutive days), "Chores" (total count)
```

##### 5.3.4 CompletionCheckbox (`components/completion-checkbox.tsx`)
Enhanced checkbox for marking chores as done, larger than generic checkbox.
```
Size:       h-8 w-8  (32px, large touch target)
Unchecked:  border-2 border-[var(--color-charcoal)]/30  rounded-full  bg-white
Hover:      border-[var(--color-sage)]  bg-[var(--color-sage)]/5
Checked:    bg-[var(--color-sage)]  border-[var(--color-sage)]  text-white

Framer Motion: On check → scale 1 → 1.2 → 1 (spring, 300ms) + checkmark pathLength 0→1
Optional: small confetti/particle celebration effect.
```

#### 5.4 Pages

##### 5.4.1 Dashboard Page (`app/(dashboard)/page.tsx`)
```
Top:     <DashboardStats />
Middle:  "Today's Tasks" — scheduled chores for today with CompletionCheckbox
         Wrapped in <Card> with divide-y dividers, each row: checkbox + title + FrequencyBadge
         If no tasks → <EmptyState icon={CalendarCheck} title="All clear!" subtitle="No tasks scheduled for today" />
Bottom:  "Recent Activity" — last 5 completions as simple timeline
```

##### 5.4.2 Chores Page (`app/(dashboard)/chores/page.tsx`)
```
Top:     Page header ("Chores") + <Button>Add Chore</Button> → opens ChoreForm dialog
Filters: Row of frequency toggle chips to filter (all/daily/weekly/monthly/yearly)
         Active chip:   bg-[var(--color-terracotta)] text-white
         Inactive chip: bg-white text-[var(--color-charcoal)]/60 border border-[var(--color-charcoal)]/15
                        hover:border-[var(--color-charcoal)]/30
         Chips: px-3 py-1.5 rounded-full text-sm font-display font-medium cursor-pointer transition-colors
Grid:    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4  of ChoreCards
         If no chores → <EmptyState icon={ClipboardList} title="No chores yet" subtitle="Add your first chore to get started" cta="Add Chore" />
```

#### 5.5 Dependencies to Install
- `sonner` — toast notifications
- `@radix-ui/react-select` — accessible select component
- `lucide-react` — icon system (may already be installed)

#### 5.6 Text Hierarchy (use consistently across all components)
```
Primary:   text-[var(--color-charcoal)]         — Headings, card titles, labels
Secondary: text-[var(--color-charcoal)]/70       — Descriptions, metadata, timestamps
Tertiary:  text-[var(--color-charcoal)]/50       — Placeholders, disabled text, help text
Muted:     text-[var(--color-charcoal)]/40       — Decorative labels, empty-state hints
```

#### 5.7 Form Patterns (use consistently in all forms)
```tsx
<form className="space-y-4">
  <div className="space-y-1.5">
    <label className="text-sm font-medium font-[var(--font-display)] text-[var(--color-charcoal)]">
      Field Label
    </label>
    <Input ... />
    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
  </div>
  <div className="flex justify-end gap-3 pt-2">
    <Button variant="ghost" type="button">Cancel</Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </Button>
  </div>
</form>
```
Labels always visible (no floating labels). Errors as red text directly below the field.

#### 5.8 Color Usage Rules
| Context | Color |
|---|---|
| Primary CTA | Terracotta fill |
| Secondary CTA / success | Sage fill |
| Destructive | Tailwind `red-600` |
| Page backgrounds | Cream or warm-white |
| Card backgrounds | White |
| Borders & dividers | Cream |
| Subtle borders (inputs, chips) | Charcoal/10 or charcoal/15 |
| Active/selected state | Cream fill + charcoal text |

**Never use raw hex codes** — always reference CSS variables.

#### 5.9 Icon System
Use **Lucide React** (`lucide-react`) exclusively. No mixing icon libraries.
```
Size:         20px default, 16px inline/small, 24px empty states (48px)
Stroke width: 1.5 (Lucide default)
Color:        currentColor (inherit from parent)
Common: LayoutDashboard, ClipboardList, CalendarDays, Plus, Pencil, Trash2,
        MoreHorizontal, Check, X, User, LogOut, CalendarCheck, Search, SlidersHorizontal
```

#### 5.10 Responsive Breakpoints
| Breakpoint | Layout | Navigation |
|---|---|---|
| < 768px (mobile) | Single column, full-width cards | Bottom tab bar |
| 768px–1024px (tablet) | 2-column grid, sidebar | Left sidebar |
| > 1024px (desktop) | 3-column grid, sidebar | Left sidebar (full) |

Touch targets: minimum 44x44px everywhere. Tighter spacing on mobile (`gap-3`, `p-4`), more generous on desktop (`gap-4`, `p-6`). Scale down headings on mobile (`text-2xl` → `text-xl`).

#### 5.11 Tests
- Component tests for every new UI primitive (FrequencyBadge, Select, Textarea, Skeleton, EmptyState, Avatar)
- Component tests for every feature component (ChoreCard, ChoreForm, DashboardStats, CompletionCheckbox, Sidebar, BottomBar)
- Page-level tests for Dashboard and Chores pages (render, empty states, data loading)
- Write phase summary: `web/docs/PHASE_5_SUMMARY.md`

### Phase 6: Schedule System & Calendar (v0.6.0)
1. Build schedule/calendar view (`app/(dashboard)/schedule/page.tsx`):
   - Display schedules in calendar format
   - Show upcoming tasks
   - Use the same page shell and navigation from Phase 5
2. Implement slot creation UI:
   - Daily view: daily chores + 1 cascaded weekly chore
   - Weekly view: weekly chores + 1 cascaded monthly chore
   - Monthly view: monthly chores + 1 cascaded yearly chore
3. Build SlotPicker component (`components/slot-picker.tsx`):
   - Show suggested task from algorithm (`POST /api/schedules/suggest`)
   - Allow manual override/selection
   - Click-to-select interface
   - Style with same card/badge/button primitives from Phase 5
4. Add completion flow for scheduled tasks:
   - Use CompletionCheckbox from Phase 5
   - Toast on completion success
   - Revalidate dashboard data after completion
5. Write component tests for schedule components
6. Test full schedule workflow end-to-end
7. Write phase summary: `web/docs/PHASE_6_SUMMARY.md`

### Phase 7: Polish & Production Release (v1.0.0)
1. **Framer Motion animations** (use sparingly for meaningful moments):
   - Page content fade-in: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}`
   - List item stagger: `staggerChildren: 0.05`, each item `{ opacity: 0, y: 8 } → { opacity: 1, y: 0 }`
   - Completion celebration: `animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3, ease: "easeOut" }}`
   - Layout reorder: `layout` prop with `type: "spring", stiffness: 300, damping: 25`
   - **Only animate** `opacity` and `transform` (translate, scale, rotate) — GPU-composited only
2. **Micro-interactions** (CSS transitions, 200ms default, ease-out):
   - Button press: `active:scale-[0.97]`
   - Card hover: shadow lift + subtle border appearance (`hover:-translate-y-0.5 hover:shadow-[var(--shadow-lifted)]`)
   - Toast enter: slide up from bottom + fade in
   - Dialog: backdrop fade + content zoom from 95%
3. **Loading states**: Replace blank space with Skeleton components from Phase 5 on every data-fetching page
4. **Error handling**: Error boundaries for component failures + Toast notifications for API errors
5. **Responsive QA**:
   - Verify at 375px (mobile), 768px (tablet), 1280px (desktop)
   - All touch targets ≥ 44x44px
   - Tighter spacing mobile (`gap-3`, `p-4`), more generous desktop (`gap-4`, `p-6`)
   - Scale down headings on mobile (`text-2xl` → `text-xl`)
6. Add completion history view
7. Performance: code splitting, Server Components optimization
8. Final testing pass (all tests passing, >80% coverage)
9. Verification checklist:
   - All components use `cn()` + accept `className` prop
   - No hardcoded hex values — CSS variables only
   - All interactive elements have visible focus states (terracotta ring)
   - Empty states show EmptyState component with relevant icon/message
   - Toasts confirm destructive actions and celebrate completions
   - `npm run lint && npm run test && npm run build` passes
10. Deploy to Vercel production
11. Write phase summary: `web/docs/PHASE_7_SUMMARY.md`

## Key Features Implementation Details

### Task Suggestion Algorithm (`lib/suggestions.ts`)
```typescript
// Suggest a cascaded chore from the next higher frequency level:
// 1. Never completed tasks (highest priority)
// 2. Least recently completed
// 3. Respect user assignments
// Cascade direction (one level only):
//   daily ← weekly, weekly ← monthly, monthly ← yearly

function suggestCascadedChore(
  currentFrequency: Frequency,
  userId?: string
): Promise<Chore>
```

### Cascade System Rules
The cascade determines **suggestions**, not hard constraints. The default is one chore cascaded down per cycle from the next higher level:
- **Daily**: daily chores + 1 weekly chore cascaded down
- **Weekly**: weekly chores + 1 monthly chore cascaded down
- **Monthly**: monthly chores + 1 yearly chore cascaded down
- **Yearly**: yearly chores only (no higher level)

This ensures all chores get completed within their frequency cycle (e.g., 12 yearly chores → 1/month → all done by year's end). However, users are **free to pull more than the default** — e.g., scheduling 2 yearly chores in one month if they want to get ahead. The system warns if there are more chores at a level than available slots (e.g., >12 yearly chores), but does not block the user.

### Day-Level Scheduling
All chores — regardless of their frequency or how they were cascaded — ultimately get scheduled onto **specific dates**. The user's daily view is the single source of truth: "here's what I need to do today."

There is a periodic **scheduling workflow** where the user plans upcoming days:
1. The system suggests chores to schedule based on cascade logic
2. The user accepts, overrides, or adds additional chores
3. If the user falls behind the cascade pace (e.g., 3 yearly chores unscheduled with only 2 months left), the system shows a warning

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

5. **Cascade & Scheduling**:
   - Open scheduling workflow, verify cascade suggestions appear
   - Schedule a cascaded yearly chore onto a specific date
   - Schedule 2 yearly chores in one month (verify no blocking, just warning)
   - View daily schedule — verify all scheduled chores appear for today
   - Complete a cascaded chore and verify it counts toward the yearly total
   - Fall behind on scheduling — verify warning appears

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
