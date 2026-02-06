import { authApiHandler } from '@neondatabase/auth/next/server';

/**
 * Neon Auth API handler
 * Handles all authentication requests:
 * - POST /api/auth/sign-in - Sign in with email/password
 * - POST /api/auth/sign-up - Create new account (requires approval)
 * - POST /api/auth/sign-out - Sign out
 * - GET /api/auth/session - Get current session
 * - OAuth flows (Google, GitHub, etc.)
 *
 * Note: New accounts are created with approved=false and require
 * administrator approval before accessing the application
 */
export const { GET, POST } = authApiHandler();

// Force dynamic rendering
export const dynamic = 'force-dynamic';
