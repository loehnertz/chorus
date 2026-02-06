# Phase 1 Summary: Foundation & Setup (v0.1.0)

## Completed Features

### Next.js + TypeScript + App Router
- Next.js app lives in `web/` using the App Router (`web/app/`)
- TypeScript configured and used across the codebase

### Prisma + Postgres Foundation
- Prisma schema defined in `web/prisma/schema.prisma` for the core domain models:
  - `User`, `Chore`, `ChoreAssignment`, `Schedule`, `ChoreCompletion`, `Frequency`
- Prisma client generation wired via `postinstall` script (`web/package.json`)

### Styling + Theme System
- TailwindCSS configured and used throughout the app
- CSS-variable theme tokens defined in `web/app/globals.css` (Domestic Futurism palette + semantic tokens)
- Custom fonts configured via `next/font` in `web/app/layout.tsx` and consumed via CSS variables

### UI Primitives
- Core primitives implemented in `web/components/ui/`:
  - `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`, `input.tsx`
- Primitives use `cn()` for class merging and accept `className` for overrides

### Testing Infrastructure
- Jest + React Testing Library configured:
  - `web/jest.config.js`, `web/jest.setup.js`
- `npm run test` wired in `web/package.json`

## File Structure

```text
web/
  app/
    layout.tsx
    globals.css
  components/
    ui/
  prisma/
    schema.prisma
  jest.config.js
  jest.setup.js
  package.json
```

## Testing Status

- `npm run lint && npm run test && npm run build` passes on current Phase 5 branch state

## Known Limitations

- Phase 1 provides the technical foundation; feature completeness is covered in later phases (auth, APIs, scheduling, dashboard UI)
