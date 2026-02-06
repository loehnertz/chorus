# Security Configuration

## Approval-Based Access Control

Chorus implements a **two-layer security model** where all users must be both authenticated AND approved to access data.

### Security Model Overview

1. **Public Sign-Up with Approval Requirement**
   - Users can self-register at `/sign-up`
   - New accounts are created with `approved: false` by default
   - Users see "Pending Approval" page after registration
   - Administrator must manually approve accounts via CLI script

2. **Two-Layer Security Model**
   - **Layer 1: Authentication** (Neon Auth) - Verifies identity
   - **Layer 2: Approval** (App layer) - Verifies authorization
   - All data access requires BOTH authentication AND approval
   - Unapproved users cannot read or write any application data

3. **Defense in Depth**
   - Unapproved users are blocked at multiple levels:
     - Dashboard layout redirects to `/pending-approval`
     - All protected routes check approval via `requireApprovedUser()`
     - Future API routes must use `requireApprovedUser()` wrapper
   - Even if authentication succeeds, unapproved users cannot access data

### Approval Workflow

**List Unapproved Users:**
```bash
npx tsx scripts/approve-user.ts
```

**Approve Specific User:**
```bash
npx tsx scripts/approve-user.ts <user-id>
```

**Example Output:**
```
✓ User approved!
   ID: 123e4567-e89b-12d3-a456-426614174000
   Name: Jane Doe
   Email: jane@example.com
```

### Security Best Practices

**Recommended Configuration:**
- ✅ Enable two-factor authentication in Neon Console (when available)
- ✅ Use strong passwords (enforced: min 8 characters)
- ✅ Review approval requests promptly
- ✅ Revoke approval for inactive users
- ✅ Monitor sign-up activity for abuse

**Future Enhancements (Phase 3+):**
- Rate limiting on sign-up/sign-in endpoints (5 attempts/min per IP)
- Account lockout after failed login attempts
- Enhanced password complexity requirements
- Session timeout configuration
- RBAC with roles (PENDING → MEMBER → ADMIN)

## User Sync Behavior

After creating a user in Neon Auth or signing up:
1. User signs in at `/sign-in`
2. Neon Auth authenticates the user
3. On successful sign-in, the app automatically:
   - Creates a User record in the app database (if first login)
   - Syncs user data (name, image) from Neon Auth
   - Uses the same UUID from Neon Auth as the User ID
   - Sets `approved: false` by default

## Testing Approval Flow

To verify that the approval system works correctly:

```bash
# 1. Sign up a new user at http://localhost:3001/sign-up
# 2. Try to access dashboard (should redirect to /pending-approval)

# 3. List unapproved users
npx tsx scripts/approve-user.ts

# 4. Approve the user
npx tsx scripts/approve-user.ts <user-id-from-step-3>

# 5. Sign in again and verify dashboard access works
```

## Manual User Sync (Troubleshooting)

If user sync fails during sign-in, use the manual sync script:

```bash
npx tsx scripts/manual-sync-user.ts user@example.com
```

**Security Note:** This script is disabled in production and requires valid email format.

## Session Security Configuration

Session and cookie security is configured in the **Neon Console**, not in application code.

### Recommended Settings (Neon Console)

Go to [Neon Console](https://console.neon.tech) → Your Project → **Auth** → **Settings**:

1. **Session Duration:**
   - Maximum session age: 7 days (168 hours)
   - Session refresh interval: 24 hours
   - Idle timeout: 8 hours

2. **Cookie Settings:**
   - ✅ HttpOnly flag enabled (prevents XSS attacks)
   - ✅ Secure flag enabled in production (HTTPS only)
   - ✅ SameSite: Lax (CSRF protection)

3. **Password Policy:**
   - Minimum length: 8 characters (current)
   - **Recommended:** Enable complexity requirements (uppercase, numbers, special chars)

4. **Additional Security:**
   - Enable two-factor authentication (if available)
   - Configure OAuth providers (Google, GitHub)
   - Set up email verification
   - Configure password reset flow

**Note:** Session configuration cannot be set in `createAuthServer()` - it's managed by the Neon Auth service.

## Deployment Security Checklist

Before deploying to production:

- [ ] Review all unapproved users and approve/deny as needed
- [ ] Ensure only authorized users have database access
- [ ] Document admin credentials securely (use password manager)
- [ ] Set strong `NEON_AUTH_COOKIE_SECRET` in production environment (min 32 characters)
- [ ] Enable HTTPS in production (Vercel does this automatically)
- [ ] **Configure session security in Neon Console** (see above)
- [ ] Verify password policy in Neon Console
- [ ] Enable email verification in Neon Console
- [ ] Configure OAuth providers in Neon Console (if using)
- [ ] Consider implementing rate limiting (see Phase 3 tasks)
- [ ] Test approval workflow end-to-end

## Recommended Security Headers

Add these headers in `next.config.js` for production:

```javascript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  },
],
```

## Future: Role-Based Access Control (RBAC)

Planned for future phases:

```typescript
enum UserRole {
  PENDING    // Awaiting approval
  MEMBER     // Approved, can view/complete chores
  ADMIN      // Can manage users and chores
}
```

This will enable:
- Self-service user management by admins
- Granular permissions (read-only, edit, admin)
- Audit log of who approved whom
- Automatic approval for trusted email domains

## Emergency: Disabling Sign-Up

If you need to temporarily disable sign-up (e.g., abuse):

1. **Remove sign-up route:**
   ```bash
   git mv web/app/(auth)/sign-up/page.tsx web/app/(auth)/sign-up/page.tsx.disabled
   ```

2. **Add API blocking (optional):**
   ```typescript
   // web/app/api/auth/[...path]/route.ts
   export async function POST(request: NextRequest) {
     const pathname = request.nextUrl.pathname;

     if (pathname.includes('/sign-up') || pathname.includes('/signup')) {
       return Response.json(
         { error: 'Sign-up is temporarily disabled' },
         { status: 403 }
       );
     }

     return handler.POST(request);
   }
   ```

3. **Re-enable after fixing issue:**
   - Restore the sign-up page
   - Remove API blocking code
   - Deploy

**WARNING:** Only disable sign-up if absolutely necessary for security reasons.
