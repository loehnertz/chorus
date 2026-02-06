import { dayKeyUtc, startOfTodayUtc } from '@/lib/date'

export type MonthGridCell = {
  dayKey: string
  date: Date
  inMonth: boolean
}

function mondayIndexFromUtcDay(utcDay: number) {
  // Convert JS getUTCDay() (Sun=0..Sat=6) to Monday-first index (Mon=0..Sun=6)
  return (utcDay + 6) % 7
}

export function getMonthTitleUtc(year: number, monthIndex: number) {
  const dt = new Date(Date.UTC(year, monthIndex, 1))
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt)
}

export function buildMonthGridUtc(params: {
  year: number
  monthIndex: number
}): MonthGridCell[] {
  const { year, monthIndex } = params

  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1))
  const firstWeekdayIndex = mondayIndexFromUtcDay(firstOfMonth.getUTCDay())
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(gridStart.getUTCDate() - firstWeekdayIndex)

  const cells: MonthGridCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + i)

    cells.push({
      dayKey: dayKeyUtc(date),
      date,
      inMonth: date.getUTCMonth() === monthIndex,
    })
  }

  return cells
}

export function getTodayDayKeyUtc(now = new Date()) {
  return dayKeyUtc(startOfTodayUtc(now))
}
