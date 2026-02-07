import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/sidebar'
import { BottomBar } from '@/components/bottom-bar'

/**
 * Dashboard Layout
 * Wraps all dashboard routes with approval checking
 * Ensures user is authenticated and approved before rendering
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require user to be authenticated and approved
  const session = await requireApprovedUser()

  // Pull the canonical profile image from the app DB (falls back to session).
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  })

  const userName = dbUser?.name?.trim() || session.user.name?.trim() || 'You'
  const userImage = dbUser?.image ?? session.user.image ?? null

  // User is authenticated and approved - render dashboard
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar user={{ id: session.user.id, name: userName, image: userImage }} />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-7 sm:py-8 md:py-12">
          {children}
        </div>
      </main>
      <BottomBar />
    </div>
  )
}

// Force dynamic rendering - don't cache this layout
export const dynamic = 'force-dynamic'
