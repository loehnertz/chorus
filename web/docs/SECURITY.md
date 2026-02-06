# Security Configuration

## Account Creation Policy

**Public sign-up is completely disabled.** Only the household administrator can create user accounts manually.

## Security Measures

### 1. No Public Sign-up Page
- The `/sign-up` route has been removed
- Users attempting to access `/sign-up` will get a 404 error

### 2. API Endpoint Protection
The auth API handler (`/api/auth/[...path]`) blocks all sign-up related endpoints:
- `POST /api/auth/sign-up` → **403 Forbidden**
- `POST /api/auth/signup` → **403 Forbidden**
- `POST /api/auth/register` → **403 Forbidden**

All other auth endpoints work normally:
- `POST /api/auth/sign-in` → ✅ Allowed
- `POST /api/auth/sign-out` → ✅ Allowed
- `GET /api/auth/session` → ✅ Allowed
- OAuth flows → ✅ Allowed (if configured)

### 3. Client-Side Protection
The client auth instance (`lib/auth/client.ts`) should not be used for sign-up attempts.

## How to Create User Accounts

See [MANUAL_USER_CREATION.md](./MANUAL_USER_CREATION.md) for detailed instructions on creating user accounts manually.

### Quick Reference:

**Recommended Method: Neon Console**
1. Go to [Neon Console](https://console.neon.tech)
2. Select your Chorus project
3. Navigate to **Auth** → **Users**
4. Click **"Add User"**
5. Enter email, name, and password
6. Click **Create**

**Helper Script (Development):**
```bash
npx tsx scripts/create-user.ts
```
This script provides instructions for manual user creation.

## User Sync Behavior

After creating a user in Neon Auth:
1. User signs in at `/sign-in`
2. Neon Auth authenticates the user
3. On successful sign-in, the app automatically:
   - Creates a User record in the app database (if first login)
   - Syncs user data (name, image) from Neon Auth
   - Uses the same UUID from Neon Auth as the User ID

## Testing Account Creation Protection

To verify that sign-up is properly blocked:

```bash
# Try to access sign-up page (should return 404)
curl http://localhost:3001/sign-up

# Try to call sign-up API (should return 403)
curl -X POST http://localhost:3001/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Expected response:
# {"error":"Public sign-up is disabled. Accounts must be created manually by the administrator."}
```

## Deployment Security Checklist

Before deploying to production:

- [ ] Verify `/sign-up` route is removed (returns 404)
- [ ] Test that `POST /api/auth/sign-up` returns 403
- [ ] Ensure only authorized users have database access
- [ ] Document admin credentials securely (use password manager)
- [ ] Set strong `NEON_AUTH_COOKIE_SECRET` in production environment
- [ ] Enable HTTPS in production (Vercel does this automatically)
- [ ] Review Neon Auth security settings in Neon Console

## Emergency: Re-enabling Sign-up

If you need to temporarily enable sign-up (e.g., for adding multiple users):

1. **Edit `/app/api/auth/[...path]/route.ts`:**
   - Comment out the sign-up blocking code in the POST handler
   - Redeploy

2. **Restore sign-up page (if needed):**
   - Restore the deleted `/app/(auth)/sign-up/page.tsx` from git history
   - Update middleware to include `/sign-up` in public routes

3. **Re-disable after adding users:**
   - Reverse the above changes
   - Redeploy

**WARNING:** Only do this if absolutely necessary, and disable immediately after adding users.
