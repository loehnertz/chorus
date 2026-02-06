import { db } from '@/lib/db';
import type { NeonAuthSession } from '@/types/auth';

/**
 * Check if a user is approved to access the application
 * This adds an extra layer of security beyond authentication
 *
 * @param session - Neon Auth session object
 * @returns boolean indicating if user is approved
 */
export async function isUserApproved(session: NeonAuthSession | null): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { approved: true },
    });

    return user?.approved ?? false;
  } catch (error) {
    console.error('Error checking user approval status:', error);
    return false;
  }
}

/**
 * Approve a user by ID
 * Call this to grant a user access to the application
 *
 * @param userId - The user's ID
 * @returns The updated user record
 */
export async function approveUser(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { approved: true },
  });
}

/**
 * Revoke a user's approval
 *
 * @param userId - The user's ID
 * @returns The updated user record
 */
export async function revokeUserApproval(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { approved: false },
  });
}

/**
 * List all unapproved users
 * Useful for seeing who needs approval
 *
 * @returns Array of unapproved users
 */
export async function getUnapprovedUsers() {
  return db.user.findMany({
    where: { approved: false },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
