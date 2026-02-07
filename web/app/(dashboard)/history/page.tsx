import { unstable_noStore as noStore } from 'next/cache'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { HistoryView } from '@/components/history-view'

type SearchParams = Record<string, string | string[] | undefined>

function parseScope(raw: string | undefined): 'mine' | 'household' {
  if (raw === 'household') return 'household'
  return 'mine'
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>
}) {
  noStore()
  const session = await requireApprovedUser()

  const sp = (await Promise.resolve(searchParams)) ?? {}
  const scopeRaw = Array.isArray(sp.scope) ? sp.scope[0] : sp.scope
  const scope = parseScope(scopeRaw)

  const where = scope === 'mine' ? { userId: session.user.id } : {}

  const completions = await db.choreCompletion.findMany({
    where,
    take: 75,
    orderBy: { completedAt: 'desc' },
    include: {
      chore: { select: { title: true, frequency: true } },
      user: { select: { id: true, name: true, image: true } },
    },
  })

  return (
    <HistoryView
      currentUserId={session.user.id}
      scope={scope}
      items={completions.map((c) => ({
        id: c.id,
        title: c.chore.title,
        frequency: c.chore.frequency,
        scheduleId: c.scheduleId,
        notes: c.notes,
        user: {
          id: c.user.id,
          name: c.user.name?.trim() || 'Someone',
          image: c.user.image,
        },
        completedAtLabel: c.completedAt.toISOString().slice(0, 16).replace('T', ' '),
      }))}
    />
  )
}

export const dynamic = 'force-dynamic'
