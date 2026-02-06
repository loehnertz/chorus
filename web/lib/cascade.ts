import type { Frequency } from '@/types/frequency'

export function getCascadeSourceFrequency(currentFrequency: Frequency): Frequency | null {
  if (currentFrequency === 'DAILY') return 'WEEKLY'
  if (currentFrequency === 'WEEKLY') return 'MONTHLY'
  if (currentFrequency === 'MONTHLY') return 'YEARLY'
  return null
}
