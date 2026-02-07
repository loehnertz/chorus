export const FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'SEMIANNUAL', 'YEARLY'] as const

export type Frequency = (typeof FREQUENCIES)[number]
