import { unstable_noStore as noStore } from 'next/cache'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { startOfTodayUtc } from '@/lib/date'
import { ScheduleView } from '@/components/schedule-view'

type SearchParams = Record<string, string | string[] | undefined>

function parseMonthParam(raw: string | undefined): { year: number; monthIndex: number } | null {
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, monthIndex: month - 1 }
}

function parseDayParam(raw: string | undefined): string | null {
  if (!raw) return null
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(raw)
  return ok ? raw : null
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>
}) {
  noStore()
  const session = await requireApprovedUser()
  const userId = session.user.id

  const sp = (await Promise.resolve(searchParams)) ?? {}
  const monthRaw = Array.isArray(sp.month) ? sp.month[0] : sp.month
  const dayRaw = Array.isArray(sp.day) ? sp.day[0] : sp.day

  const now = new Date()
  const parsedMonth = parseMonthParam(monthRaw)
  const year = parsedMonth?.year ?? now.getUTCFullYear()
  const monthIndex = parsedMonth?.monthIndex ?? now.getUTCMonth()

  const initialSelectedDayKey = parseDayParam(dayRaw)

  const monthStart = new Date(Date.UTC(year, monthIndex, 1))
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 1))

  const upcomingStart = startOfTodayUtc(now)
  const upcomingEnd = new Date(upcomingStart)
  upcomingEnd.setUTCDate(upcomingEnd.getUTCDate() + 14)

  const [chores, monthSchedulesRaw, upcomingRaw] = await Promise.all([
    db.chore.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        frequency: true,
        assignments: { select: { userId: true } },
      },
      orderBy: { title: 'asc' },
    }),
    db.schedule.findMany({
      where: { scheduledFor: { gte: monthStart, lt: monthEnd } },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
            assignments: { select: { userId: true } },
          },
        },
        completions: { where: { userId }, select: { id: true } },
      },
      orderBy: { scheduledFor: 'asc' },
    }),
    db.schedule.findMany({
      where: { scheduledFor: { gte: upcomingStart, lt: upcomingEnd } },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
            assignments: { select: { userId: true } },
          },
        },
        completions: { where: { userId }, select: { id: true } },
      },
      orderBy: { scheduledFor: 'asc' },
    }),
  ])

  const mappedChores = chores.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    frequency: c.frequency,
    assigneeIds: c.assignments.map((a) => a.userId),
  }))

  const mapSchedule = (s: (typeof monthSchedulesRaw)[number]) => ({
    id: s.id,
    scheduledFor: s.scheduledFor.toISOString(),
    slotType: s.slotType,
    suggested: s.suggested,
    completed: s.completions.length > 0,
    chore: {
      id: s.chore.id,
      title: s.chore.title,
      description: s.chore.description,
      frequency: s.chore.frequency,
      assigneeIds: s.chore.assignments.map((a) => a.userId),
    },
  })

  return (
    <ScheduleView
      userId={userId}
      year={year}
      monthIndex={monthIndex}
      initialSelectedDayKey={initialSelectedDayKey ?? undefined}
      chores={mappedChores}
      monthSchedules={monthSchedulesRaw.map(mapSchedule)}
      upcomingSchedules={upcomingRaw.map(mapSchedule)}
    />
  )
}

export const dynamic = 'force-dynamic'
