# Phase 3 Summary: Basic CRUD APIs (v0.3.0)

## Completed Features

### API Authentication Helper
- Added `requireApprovedUserApi()` to `lib/auth/require-approval.ts` — returns JSON error responses (401/403) instead of HTML redirects, suitable for API route handlers
- Added `isErrorResponse()` type guard for clean branching in route handlers

### Input Validation with Zod
- Zod schemas defined in `lib/validations.ts` for all API request bodies
- `createChoreSchema` — validates title (required, trimmed), frequency (enum), optional description, optional assigneeIds
- `updateChoreSchema` — partial update validation with at-least-one-field refinement
- `createCompletionSchema` — validates choreId (required), optional scheduleId/notes/completedAt (date coercion)
- `assignChoreSchema` — validates userId (required)
- `formatValidationError()` — converts Zod errors to structured `{ error, details: { formErrors, fieldErrors } }` API responses

### Chores CRUD API
- **GET /api/chores** — List all chores with optional `frequency` and `search` (case-insensitive title) filters. Includes assignments with user details. Ordered by `createdAt` desc.
- **POST /api/chores** — Create a chore with Zod-validated body (`title`, `frequency`, optional `description`, optional `assigneeIds`). Returns 201.
- **GET /api/chores/[id]** — Get a single chore with assignments, recent completions (last 5), and total completion count. Returns 404 if not found.
- **PUT /api/chores/[id]** — Partial update with Zod validation. Uses transaction for atomic assignment replacement. Returns 404 if not found.
- **DELETE /api/chores/[id]** — Delete a chore (cascades to assignments, schedules, completions via schema). Returns 204. Returns 404 if not found.

### ChoreAssignment API
- **POST /api/chores/[id]/assignments** — Assign a user to a chore. Validates chore and user exist, prevents duplicate assignments (409). Returns 201.
- **DELETE /api/chores/[id]/assignments/[userId]** — Remove a user's assignment from a chore. Returns 204. Returns 404 if assignment not found.

### Completions API
- **POST /api/completions** — Record a completion for a chore with Zod-validated body. Uses session user as completing user. Optional `scheduleId`, `notes`, `completedAt`. Validates chore/schedule existence. Returns 201.
- **GET /api/completions** — List completions with filters: `choreId`, `userId`, `from`/`to` date range. Paginated with `limit` (max 100, default 50) and `offset`. Returns `{ completions, total, limit, offset }`.

### Seed Script
- `prisma/seed.ts` — Seeds 17 sample chores across all 4 frequencies. If approved users exist, creates round-robin assignments and 7 days of sample completions.
- Added `prisma.seed` config to `package.json`

### Test Infrastructure
- `lib/__tests__/test-helpers.ts` — Shared `createMockSession()` and `createMockRequest()` factories
- Updated `jest.config.js` test match pattern to exclude non-test helper files from `__tests__/` directories

## File Structure

```
web/
├── app/api/
│   ├── chores/
│   │   ├── route.ts                                    # GET list + POST create
│   │   ├── [id]/
│   │   │   ├── route.ts                                # GET single + PUT update + DELETE
│   │   │   ├── assignments/
│   │   │   │   ├── route.ts                            # POST assign user
│   │   │   │   ├── [userId]/
│   │   │   │   │   └── route.ts                        # DELETE unassign user
│   │   │   │   └── __tests__/route.test.ts             # 11 tests
│   │   │   └── __tests__/route.test.ts                 # 15 tests
│   │   └── __tests__/route.test.ts                     # 16 tests
│   └── completions/
│       ├── route.ts                                    # POST create + GET list
│       └── __tests__/route.test.ts                     # 16 tests
├── lib/
│   ├── auth/
│   │   ├── require-approval.ts                         # MODIFIED: added API variants
│   │   └── __tests__/require-approval.test.ts          # 7 tests
│   ├── validations.ts                                  # Zod schemas for all API inputs
│   ├── __tests__/test-helpers.ts                       # Mock factories
│   └── __tests__/validations.test.ts                   # 25 tests
├── prisma/seed.ts                                      # Database seed script
├── package.json                                        # MODIFIED: prisma.seed config, zod dep
├── jest.config.js                                      # MODIFIED: test match pattern
└── docs/PHASE_3_SUMMARY.md                             # This file
```

## Key Implementation Details

- **Zod v4 validation** — all request bodies validated with Zod schemas; structured error responses with field-level details
- **Transform-then-validate pattern** — uses `.transform().pipe()` to trim strings before checking `.min(1)`, ensuring whitespace-only strings are rejected
- **Route handlers use `Request` (not `NextRequest`)** — avoids `nextUrl` dependency, makes handlers testable with standard `Request` objects in Node test environment
- **`@jest-environment node`** pragma in API test files — API routes use `Response.json()` which requires the Node environment, not jsdom
- **`@prisma/client` mocked in test files** — prevents loading the full Prisma runtime (which requires `TextEncoder`) during tests; only the `Frequency` enum is needed
- **Session type cast** — `requireApprovedUserApi()` casts the session from `auth.getSession()` to `NeonAuthSession` since the library type has additional fields (`banned`, `role`, etc.) not in our interface
- **Duplicate assignment prevention** — uses Prisma's composite unique constraint lookup before creating assignments, returns 409 Conflict

## Database Changes

No schema changes. All models used (Chore, ChoreAssignment, ChoreCompletion, Schedule) were already defined in Phase 1.

## Testing Status

- [x] Zod validation schemas: 25 tests (all schemas, edge cases, error formatting)
- [x] API auth helper: 7 tests (401/403/success paths, type guard)
- [x] Chores list/create: 16 tests (auth, validation, happy paths, filters, errors)
- [x] Chores single/update/delete: 15 tests (auth, 404s, updates, transactions, errors)
- [x] ChoreAssignment assign/unassign: 11 tests (auth, validation, 404s, 409 conflict, errors)
- [x] Completions create/list: 16 tests (auth, validation, pagination, filters, errors)
- [x] All existing tests continue to pass (20 pre-existing tests)
- [x] **Total: 110 tests passing**
- [x] ESLint: 0 errors
- [x] TypeScript: compiles cleanly
- [x] Next.js build: succeeds

## Known Limitations

- No rate limiting on API endpoints
- No pagination on GET /api/chores (returns all chores; fine for single-household scope)
- Seed script uses `PrismaClient` directly (no adapter) — works for seeding but differs from app runtime
- `NeonAuthSession` type is narrower than the actual auth library type; cast is used as bridge

## Next Steps

Phase 4 (v0.4.0) — Suggestion Algorithm & Schedules:
- Implement the task suggestion algorithm in `lib/suggestions.ts`
- Add schedule API endpoints (`/api/schedules`)
- Build the slot-based scheduling system
