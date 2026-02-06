import { auth } from '@/lib/auth/server';

/**
 * Dashboard Page
 * Main dashboard for authenticated and approved users
 */
export default async function DashboardPage() {
  const { data: session } = await auth.getSession();

  return (
    <div className="min-h-screen bg-[var(--color-cream)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-[var(--font-display)] text-[var(--color-charcoal)] mb-4">
          Welcome to Chorus
        </h1>
        <p className="text-[var(--color-charcoal)]/70 mb-8">
          Hi {session?.user?.name || 'there'}! Your dashboard is ready.
        </p>

        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-2xl font-[var(--font-display)] text-[var(--color-charcoal)] mb-4">
            Coming Soon
          </h2>
          <p className="text-[var(--color-charcoal)]/70">
            Dashboard features will be implemented in Phase 5.
          </p>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
