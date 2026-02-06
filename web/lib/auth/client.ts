'use client';

import { createAuthClient } from '@neondatabase/auth/next';

/**
 * Neon Auth client instance
 * For use in client components to access auth state and methods:
 * - authClient.useSession() - React hook for session data
 * - authClient.signIn() - Client-side sign in
 * - authClient.signOut() - Client-side sign out
 *
 * Note: createAuthClient() automatically uses the current host (window.location.origin)
 */
export const authClient = createAuthClient();
