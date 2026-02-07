import { unstable_noStore as noStore } from 'next/cache'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { startOfTodayUtc, startOfHalfYearUtc, endOfHalfYearUtc } from '@/lib/date'
import { getTodayDayKeyUtc } from '@/lib/calendar'
import { ScheduleView } from '@/components/schedule-view'
import { ensureDailySchedules } from '@/lib/auto-schedule'

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
  searchParams?: Promise<SearchParams>
}) {
  noStore()
  const session = await requireApprovedUser()
  const userId = session.user.id

  const sp = (await searchParams) ?? {}
  const monthRaw = Array.isArray(sp.month) ? sp.month[0] : sp.month
  const dayRaw = Array.isArray(sp.day) ? sp.day[0] : sp.day

  const now = new Date()
  const todayDayKey = getTodayDayKeyUtc(now)

  const parsedMonth = parseMonthParam(monthRaw)
  const year = parsedMonth?.year ?? now.getUTCFullYear()
  const monthIndex = parsedMonth?.monthIndex ?? now.getUTCMonth()

  const initialSelectedDayKey = parseDayParam(dayRaw) ?? todayDayKey

  const monthStart = new Date(Date.UTC(year, monthIndex, 1))

  // Calendar grid spans 6 full weeks starting Monday.
  const monthStartDow = monthStart.getUTCDay() // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = (monthStartDow + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setUTCDate(gridStart.getUTCDate() - daysSinceMonday)
  const gridEnd = new Date(gridStart)
  gridEnd.setUTCDate(gridEnd.getUTCDate() + 42)

  await ensureDailySchedules(now, gridEnd)

  const yearStart = new Date(Date.UTC(year, 0, 1))
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1))

  // Use the viewed month to anchor long-range (half-year) scheduling state.
  const halfYearStart = startOfHalfYearUtc(monthStart)
  const halfYearEnd = endOfHalfYearUtc(monthStart)

  const upcomingStart = startOfTodayUtc(now)
  const upcomingEnd = new Date(upcomingStart)
  upcomingEnd.setUTCDate(upcomingEnd.getUTCDate() + 14)

  const [chores, monthSchedulesRaw, upcomingRaw, yearlyScheduledRaw, semiannualScheduledRaw, users] = await Promise.all([
    db.chore.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        frequency: true,
        assignments: { select: { userId: true }, orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }] },
      },
      orderBy: { title: 'asc' },
    }),
    db.schedule.findMany({
      where: { hidden: false, scheduledFor: { gte: gridStart, lt: gridEnd } },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
            assignments: { select: { userId: true }, orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }] },
          },
        },
        completion: {
          select: { id: true, userId: true, completedAt: true },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    }),
    db.schedule.findMany({
      where: {
        hidden: false,
        scheduledFor: { gte: upcomingStart, lt: upcomingEnd },
        completion: { is: null },
      },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
            assignments: { select: { userId: true }, orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }] },
          },
        },
        completion: {
          select: { id: true, userId: true, completedAt: true },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    }),
    db.schedule.findMany({
      where: {
        hidden: false,
        scheduledFor: { gte: yearStart, lt: yearEnd },
        chore: { frequency: 'YEARLY' },
      },
      distinct: ['choreId'],
      select: { choreId: true },
    }),
    db.schedule.findMany({
      where: {
        hidden: false,
        scheduledFor: { gte: halfYearStart, lt: halfYearEnd },
        chore: { frequency: 'SEMIANNUAL' },
      },
      distinct: ['choreId'],
      select: { choreId: true },
    }),
    db.user.findMany({
      where: { approved: true },
      select: { id: true, name: true, image: true },
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
    completed: !!s.completion,
    completedByUserId: s.completion?.userId ?? null,
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
      todayDayKey={todayDayKey}
      initialSelectedDayKey={initialSelectedDayKey}
      chores={mappedChores}
      monthSchedules={monthSchedulesRaw.map(mapSchedule)}
      upcomingSchedules={upcomingRaw.map(mapSchedule)}
      longRangeScheduledChoreIds={{
        YEARLY: yearlyScheduledRaw.map((r) => r.choreId),
        SEMIANNUAL: semiannualScheduledRaw.map((r) => r.choreId),
      }}
      users={users}
    />
  )
}

export const dynamic = 'force-dynamic'
