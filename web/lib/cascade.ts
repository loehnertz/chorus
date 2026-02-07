import type { Frequency } from '@/types/frequency'

export function getCascadeSourceFrequency(currentFrequency: Frequency): Frequency | null {
  if (currentFrequency === 'DAILY') return 'WEEKLY'
  if (currentFrequency === 'WEEKLY') return 'BIWEEKLY'
  if (currentFrequency === 'BIWEEKLY') return 'MONTHLY'
  if (currentFrequency === 'MONTHLY') return 'BIMONTHLY'
  if (currentFrequency === 'BIMONTHLY') return 'SEMIANNUAL'
  if (currentFrequency === 'SEMIANNUAL') return 'YEARLY'
  return null
}
