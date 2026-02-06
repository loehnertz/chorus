import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

/**
 * Root Page
 * Redirects to dashboard if authenticated, otherwise to sign-in
 */
export default async function HomePage() {
  const { data: session } = await auth.getSession();

  if (session?.user) {
    redirect('/dashboard');
  } else {
    redirect('/sign-in');
  }
}

export const dynamic = 'force-dynamic';
