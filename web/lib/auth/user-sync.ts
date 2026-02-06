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
    // Check if user already exists in app database
    const existingUser = await db.user.findUnique({
      where: { id: neonUser.id },
    });

    if (existingUser) {
      // Update existing user with latest data from Neon Auth
      // Don't change approval status unless explicitly specified
      return await db.user.update({
        where: { id: neonUser.id },
        data: {
          name: neonUser.name || null,
          image: neonUser.image || null,
          ...(approved !== undefined && { approved }),
        },
      });
    } else {
      // Create new user record in app database
      // Default to NOT approved for security (admin must approve)
      return await db.user.create({
        data: {
          id: neonUser.id, // Use the same UUID from Neon Auth
          name: neonUser.name || null,
          image: neonUser.image || null,
          approved: approved ?? false, // Require approval by default
        },
      });
    }
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
