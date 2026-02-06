import { buildMonthGridUtc, getMonthTitleUtc, getTodayDayKeyUtc } from '@/lib/calendar'

describe('calendar', () => {
  it('buildMonthGridUtc returns a 6-week (42-cell) grid', () => {
    const grid = buildMonthGridUtc({ year: 2026, monthIndex: 1 }) // Feb
    expect(grid).toHaveLength(42)
    expect(grid[0]).toHaveProperty('dayKey')
    expect(grid[0]).toHaveProperty('inMonth')
  })

  it('buildMonthGridUtc marks inMonth cells correctly', () => {
    const grid = buildMonthGridUtc({ year: 2026, monthIndex: 1 })
    expect(grid.some((c) => c.inMonth)).toBe(true)
    expect(grid.some((c) => !c.inMonth)).toBe(true)

    for (const cell of grid) {
      if (cell.inMonth) {
        expect(cell.date.getUTCFullYear()).toBe(2026)
        expect(cell.date.getUTCMonth()).toBe(1)
      }
    }
  })

  it('getMonthTitleUtc formats month/year in UTC', () => {
    expect(getMonthTitleUtc(2026, 0)).toBe('January 2026')
  })

  it('getTodayDayKeyUtc returns YYYY-MM-DD in UTC', () => {
    expect(getTodayDayKeyUtc(new Date('2026-02-06T23:59:59Z'))).toBe('2026-02-06')
  })
})
