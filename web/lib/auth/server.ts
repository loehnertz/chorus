import { createAuthServer } from '@neondatabase/auth/next/server';

/**
 * Neon Auth server instance
 * Provides server-side authentication methods:
 * - auth.getSession() - Get current session in server components/actions
 * - auth.middleware() - Protect routes with middleware
 * - auth.apiHandler() - Handle auth API routes
 *
 * Note: createAuthServer() automatically reads from environment variables:
 * - NEON_AUTH_BASE_URL
 * - NEON_AUTH_COOKIE_SECRET
 */
export const auth = createAuthServer();
