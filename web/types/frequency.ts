export const FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'SEMIANNUAL', 'YEARLY'] as const

export type Frequency = (typeof FREQUENCIES)[number]

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  BIMONTHLY: 'Bi-monthly',
  SEMIANNUAL: 'Semi-annual',
  YEARLY: 'Annual',
}
