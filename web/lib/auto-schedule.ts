import { db } from '@/lib/db'
import { startOfTodayUtc } from '@/lib/date'

/**
 * Auto-schedule all DAILY-frequency chores for a date range.
 *
 * When `through` is omitted only today is scheduled. When provided, every day
 * from today through `through` (exclusive) gets schedules for all daily chores.
 *
 * Uses createMany with skipDuplicates (backed by the @@unique([choreId, scheduledFor])
 * constraint) so concurrent calls are safe and idempotent.
 */
export async function ensureDailySchedules(
  now?: Date,
  through?: Date,
): Promise<{ created: number }> {
  const today = startOfTodayUtc(now)

  const dailyChores = await db.chore.findMany({
    where: { frequency: 'DAILY' },
    select: { id: true },
  })

  if (dailyChores.length === 0) {
    return { created: 0 }
  }

  const days: Date[] = [today]
  if (through) {
    const end = startOfTodayUtc(through)
    const cursor = new Date(today)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    while (cursor < end) {
      days.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  const data = days.flatMap((day) =>
    dailyChores.map((chore) => ({
      choreId: chore.id,
      scheduledFor: day,
      slotType: 'DAILY' as const,
      suggested: false,
    })),
  )

  const result = await db.schedule.createMany({ data, skipDuplicates: true })

  return { created: result.count }
}
