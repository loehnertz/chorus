# Manual User Creation & Approval Guide

Since public sign-up is disabled, you need to manually create user accounts for your household members.

## Two-Layer Security System

Chorus uses a **defense-in-depth** approach:

1. **Layer 1**: Public sign-up is completely blocked via API
2. **Layer 2**: All new users require approval before accessing data

Even if someone bypasses Layer 1, they cannot access anything without approval.

## Method 1: Using Neon Console (Recommended)

1. Go to your [Neon Console](https://console.neon.tech)
2. Select your Chorus project
3. Navigate to **Auth** in the sidebar
4. Click **"Add User"** or **"Create User"**
5. Enter the user's details:
   - **Email**: The user's email address
   - **Name**: The user's display name
   - **Password**: A secure password (min 8 characters)
6. Click **Create**

The user can now sign in at `/sign-in` with their email and password. Their User record in the app database will be automatically created on first login.

## Method 2: Using Prisma Studio

If Neon Console doesn't have a user creation UI, you can create users directly via SQL:

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Navigate to the `neon_auth` schema (if accessible)

3. Create a user record manually

**Note**: This method requires proper password hashing using Better Auth's hashing algorithm, so the Neon Console method is strongly recommended.

## Method 3: Temporary Admin Endpoint (Development Only)

For local development, you can create a temporary admin endpoint:

1. Create `app/api/admin/create-user/route.ts`:

```typescript
import { NextRequest } from 'next/server';

// WARNING: This is for development only!
// Remove or protect this endpoint in production!
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, name, password } = await request.json();

  // Call Neon Auth API to create user
  // Implementation depends on Neon Auth SDK

  return Response.json({ success: true });
}
```

2. Call it via HTTP client or curl:
```bash
curl -X POST http://localhost:3001/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"User Name","password":"securepass123"}'
```

**IMPORTANT**: Delete this endpoint before deploying to production!

## User Sync & Approval Behavior

### On First Sign-In:
1. Neon Auth authenticates them (checks email/password in `neon_auth` schema)
2. A session is created
3. The app automatically creates a `User` record in the app schema with `approved: false`
4. User is redirected to `/pending-approval` page
5. They cannot access any data until you approve them

### Approving Users:

**Quick Method - Using the Approval Script:**
```bash
# List all users pending approval
npx tsx scripts/approve-user.ts

# Approve a specific user by ID
npx tsx scripts/approve-user.ts <user-id-from-list>
```

**Alternative - Using Prisma Studio:**
```bash
npx prisma studio
```
1. Navigate to the `User` model
2. Find the user
3. Set `approved` to `true`
4. Save

**Alternative - Using SQL:**
```sql
-- Approve a user by ID
UPDATE "User" SET approved = true WHERE id = '<user-id>';

-- List unapproved users
SELECT id, name, email, "createdAt" FROM "User" WHERE approved = false;
```

### On Subsequent Logins:
- The existing User record is updated with any changes from Neon Auth (name, image)
- Approval status is preserved (not changed)
- No duplicate records are created (ID is synced from Neon Auth)

## Security Note

Since each deployment represents one household:
- Only create accounts for trusted household members
- Store passwords securely (use a password manager)
- Consider using strong, unique passwords for each user
- Neon Auth handles password hashing and secure storage
