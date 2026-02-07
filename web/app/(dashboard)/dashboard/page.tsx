import { unstable_noStore as noStore } from 'next/cache'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { DashboardView } from '@/components/dashboard-view'
import { PageFadeIn } from '@/components/page-fade-in'
import { startOfTomorrowUtc, startOfTodayUtc, startOfWeekUtc } from '@/lib/date'
import { computeStreakDaysUtc } from '@/lib/streak'
import { ensureDailySchedules } from '@/lib/auto-schedule'

/**
 * Dashboard Page
 * Main dashboard for authenticated and approved users
 */
export default async function DashboardPage() {
  noStore()
  const session = await requireApprovedUser()
  const userId = session.user.id

  const now = new Date()
  await ensureDailySchedules(now)

  const startToday = startOfTodayUtc(now)
  const startTomorrow = startOfTomorrowUtc(now)
  const startWeek = startOfWeekUtc(now)

  const [
    choresCount,
    completedTotal,
    completedThisWeek,
    completionDates,
    schedules,
    recent,
  ] = await Promise.all([
    db.chore.count(),
    db.choreCompletion.count({ where: { userId } }),
    db.choreCompletion.count({ where: { userId, completedAt: { gte: startWeek } } }),
    db.choreCompletion.findMany({
      where: { userId, completedAt: { gte: new Date(startToday.getTime() - 1000 * 60 * 60 * 24 * 60) } },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    }),
    db.schedule.findMany({
      where: { scheduledFor: { gte: startToday, lt: startTomorrow } },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            frequency: true,
            assignments: { select: { userId: true } },
          },
        },
        completion: { select: { id: true, userId: true } },
      },
      orderBy: { scheduledFor: 'asc' },
    }),
    db.choreCompletion.findMany({
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        chore: { select: { title: true, frequency: true } },
        user: { select: { id: true, name: true, image: true } },
      },
    }),
  ])

  const streakDays = computeStreakDaysUtc(completionDates.map((c) => c.completedAt), now)

  const todaysTasks = schedules
    .filter((s) => {
      if (s.chore.assignments.length === 0) return true
      return s.chore.assignments.some((a) => a.userId === userId)
    })
    .map((s) => ({
      scheduleId: s.id,
      choreId: s.chore.id,
      title: s.chore.title,
      frequency: s.chore.frequency,
      completed: !!s.completion,
      completedByUserId: s.completion?.userId ?? null,
    }))

  const recentActivity = recent.map((c) => ({
    id: c.id,
    title: c.chore.title,
    frequency: c.chore.frequency,
    userId: c.user.id,
    userName: c.user.name?.trim() || 'Someone',
    userImage: c.user.image,
    completedAtLabel: c.completedAt.toISOString().slice(0, 16).replace('T', ' '),
  }))

  return (
    <PageFadeIn>
      <DashboardView
        userId={userId}
        stats={{
          choresCount,
          completedTotal,
          completedThisWeek,
          streakDays,
        }}
        todaysTasks={todaysTasks}
        recentActivity={recentActivity}
      />
    </PageFadeIn>
  )
}

export const dynamic = 'force-dynamic'
