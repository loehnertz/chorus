export function startOfTodayUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function startOfTomorrowUtc(now = new Date()) {
  const start = startOfTodayUtc(now)
  const tomorrow = new Date(start)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow
}

export function startOfWeekUtc(now = new Date()) {
  const start = startOfTodayUtc(now)
  const day = start.getUTCDay() // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = (day + 6) % 7
  start.setUTCDate(start.getUTCDate() - daysSinceMonday)
  return start
}

export function dayKeyUtc(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function endOfWeekUtc(d: Date) {
  const start = startOfWeekUtc(d)
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
}

/** ISO week number (1-based). */
function isoWeekNumber(d: Date) {
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const startOfIsoYear = startOfWeekUtc(jan4)
  const diffMs = startOfWeekUtc(d).getTime() - startOfIsoYear.getTime()
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
}

/** Bi-week pairs: weeks 1-2, 3-4, 5-6, ... */
export function startOfBiweekUtc(d: Date) {
  const weekStart = startOfWeekUtc(d)
  const weekNum = isoWeekNumber(d)
  // Odd week = first of the pair, even week = second.
  if (weekNum % 2 === 0) {
    return new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
  return weekStart
}

export function endOfBiweekUtc(d: Date) {
  const start = startOfBiweekUtc(d)
  return new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
}

/** Bi-month pairs: Jan-Feb, Mar-Apr, May-Jun, Jul-Aug, Sep-Oct, Nov-Dec */
export function startOfBimonthUtc(d: Date) {
  const month = d.getUTCMonth() // 0..11
  const pairStart = month - (month % 2) // 0, 2, 4, 6, 8, 10
  return new Date(Date.UTC(d.getUTCFullYear(), pairStart, 1))
}

export function endOfBimonthUtc(d: Date) {
  const month = d.getUTCMonth()
  const pairStart = month - (month % 2)
  return new Date(Date.UTC(d.getUTCFullYear(), pairStart + 2, 1))
}

/** Half-year: H1 (Jan-Jun), H2 (Jul-Dec) */
export function startOfHalfYearUtc(d: Date) {
  const month = d.getUTCMonth()
  return new Date(Date.UTC(d.getUTCFullYear(), month < 6 ? 0 : 6, 1))
}

export function endOfHalfYearUtc(d: Date) {
  const month = d.getUTCMonth()
  return new Date(Date.UTC(d.getUTCFullYear(), month < 6 ? 6 : 12, 1))
}

export function startOfMonthUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export function endOfMonthUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
}

export function startOfYearUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
}

export function endOfYearUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear() + 1, 0, 1))
}
