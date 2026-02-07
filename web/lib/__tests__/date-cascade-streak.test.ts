import { dayKeyUtc, startOfTodayUtc, startOfTomorrowUtc, startOfWeekUtc } from '@/lib/date'
import { getCascadeSourceFrequency } from '@/lib/cascade'
import { computeStreakDaysUtc } from '@/lib/streak'

describe('date utils (UTC)', () => {
  it('computes start of today/tomorrow', () => {
    const now = new Date('2026-02-07T15:04:05.000Z')
    expect(startOfTodayUtc(now).toISOString()).toBe('2026-02-07T00:00:00.000Z')
    expect(startOfTomorrowUtc(now).toISOString()).toBe('2026-02-08T00:00:00.000Z')
  })

  it('computes start of week (Monday)', () => {
    // 2026-02-08 is a Sunday
    const now = new Date('2026-02-08T10:00:00.000Z')
    expect(startOfWeekUtc(now).toISOString()).toBe('2026-02-02T00:00:00.000Z')
  })

  it('builds day keys', () => {
    expect(dayKeyUtc(new Date('2026-02-07T00:00:00.000Z'))).toBe('2026-02-07')
  })
})

describe('cascade utils', () => {
  it('maps to the next higher frequency', () => {
    expect(getCascadeSourceFrequency('DAILY')).toBe('WEEKLY')
    expect(getCascadeSourceFrequency('WEEKLY')).toBe('MONTHLY')
    expect(getCascadeSourceFrequency('MONTHLY')).toBe('YEARLY')
    expect(getCascadeSourceFrequency('YEARLY')).toBeNull()
  })
})

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const now = new Date('2026-02-07T12:00:00.000Z')
    const dates = [
      new Date('2026-02-07T01:00:00.000Z'),
      new Date('2026-02-06T01:00:00.000Z'),
      new Date('2026-02-05T01:00:00.000Z'),
      // Extra completion same day should not double count.
      new Date('2026-02-05T20:00:00.000Z'),
    ]

    expect(computeStreakDaysUtc(dates, now)).toBe(3)
  })

  it('stops at the first missing day', () => {
    const now = new Date('2026-02-07T12:00:00.000Z')
    const dates = [
      new Date('2026-02-07T01:00:00.000Z'),
      new Date('2026-02-05T01:00:00.000Z'),
    ]

    expect(computeStreakDaysUtc(dates, now)).toBe(1)
  })
})
