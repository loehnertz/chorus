import { db } from '@/lib/db';
import type { NeonAuthUser } from '@/types/auth';

/**
 * User Sync Logic
 * Ensures that a User record exists in the app schema for each Neon Auth user
 * This should be called after successful authentication
 */

/**
 * Sync user from Neon Auth to app database
 * Creates a User record if it doesn't exist, updates if it does
 *
 * @param neonUser - User object from Neon Auth session
 * @param approved - Optional: set approval status (default: false for new users, unchanged for existing)
 * @returns The synced User record from the app database
 */
export async function syncUser(neonUser: NeonAuthUser, approved?: boolean) {
  try {
    // Use upsert to atomically create or update the user record
    // This avoids race conditions where concurrent requests both try to create
    return await db.user.upsert({
      where: { id: neonUser.id },
      update: {
        name: neonUser.name || null,
        ...(neonUser.image ? { image: neonUser.image } : {}),
        ...(approved !== undefined && { approved }),
      },
      create: {
        id: neonUser.id,
        name: neonUser.name || null,
        image: neonUser.image || null,
        approved: approved ?? false,
      },
    });
  } catch (error) {
    console.error('Failed to sync user:', error);
    throw new Error('Failed to sync user data');
  }
}

/**
 * Get or create user in app database
 * Convenience function that syncs the user and returns the result
 *
 * @param neonUser - User object from Neon Auth session
 * @returns The User record from the app database
 */
export async function getOrCreateUser(neonUser: NeonAuthUser) {
  return syncUser(neonUser);
}
