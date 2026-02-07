import { unstable_noStore as noStore } from 'next/cache'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { ChoresView } from '@/components/chores-view'

export default async function ChoresPage() {
  noStore()
  await requireApprovedUser()

  const [chores, users] = await Promise.all([
    db.chore.findMany({
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { completions: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.findMany({
      where: { approved: true },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <ChoresView
      users={users.map((u) => ({ id: u.id, name: u.name?.trim() || 'Unknown' }))}
      chores={chores.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        frequency: c.frequency,
        completionCount: c._count.completions,
        assignees: c.assignments
          .map((a) => ({
            id: a.user.id,
            name: a.user.name?.trim() || 'Unknown',
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))}
    />
  )
}

export const dynamic = 'force-dynamic'
