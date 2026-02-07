import { db } from '@/lib/db'
import { startOfTodayUtc } from '@/lib/date'

/**
 * Auto-schedule all DAILY-frequency chores for today.
 *
 * Uses createMany with skipDuplicates (backed by the @@unique([choreId, scheduledFor])
 * constraint) so concurrent calls are safe and idempotent.
 */
export async function ensureDailySchedules(now?: Date): Promise<{ created: number }> {
  const today = startOfTodayUtc(now)

  const dailyChores = await db.chore.findMany({
    where: { frequency: 'DAILY' },
    select: { id: true },
  })

  if (dailyChores.length === 0) {
    return { created: 0 }
  }

  const result = await db.schedule.createMany({
    data: dailyChores.map((chore) => ({
      choreId: chore.id,
      scheduledFor: today,
      slotType: 'DAILY' as const,
      suggested: false,
    })),
    skipDuplicates: true,
  })

  return { created: result.count }
}
