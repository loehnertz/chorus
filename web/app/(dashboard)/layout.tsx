import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { syncUser } from '@/lib/auth/user-sync';

/**
 * Dashboard Layout
 * Wraps all dashboard routes with approval checking
 * This runs on the server, so we can access the database
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Get current session
  const { data: session } = await auth.getSession();

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Sync user data from Neon Auth to app database
  await syncUser(session.user);

  // Check if user is approved
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { approved: true },
  });

  // Redirect to pending approval page if not approved
  if (!user?.approved) {
    redirect('/pending-approval');
  }

  // User is authenticated and approved - render dashboard
  return <>{children}</>;
}

// Force dynamic rendering - don't cache this layout
export const dynamic = 'force-dynamic';
