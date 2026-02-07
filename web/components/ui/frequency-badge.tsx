import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Frequency } from '@/types/frequency'

export interface FrequencyBadgeProps {
  frequency: Frequency
  className?: string
}

const frequencyStyles: Record<Frequency, string> = {
  DAILY:
    'bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta)] border-[var(--color-terracotta)]/30',
  WEEKLY:
    'bg-[var(--color-sage)]/15 text-[var(--color-sage)] border-[var(--color-sage)]/30',
  BIWEEKLY:
    'bg-[var(--color-sage)]/10 text-[var(--color-sage)] border-[var(--color-sage)]/20',
  MONTHLY:
    'bg-[var(--color-charcoal)]/10 text-[var(--foreground)] border-[var(--foreground)]/20',
  BIMONTHLY:
    'bg-[var(--color-charcoal)]/7 text-[var(--foreground)] border-[var(--foreground)]/15',
  SEMIANNUAL:
    'bg-[var(--color-cream)]/70 text-[var(--color-charcoal)] border-[var(--color-charcoal)]/15',
  YEARLY:
    'bg-[var(--color-cream)] text-[var(--color-charcoal)] border-[var(--color-charcoal)]/20',
}

const frequencyAbbreviations: Record<Frequency, string> = {
  DAILY: 'D',
  WEEKLY: 'W',
  BIWEEKLY: '2W',
  MONTHLY: 'M',
  BIMONTHLY: '2M',
  SEMIANNUAL: 'SA',
  YEARLY: 'Y',
}

export function FrequencyBadge({ frequency, className }: FrequencyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 sm:px-3 py-1 text-xs font-medium',
        'font-[var(--font-display)] uppercase tracking-wide border',
        frequencyStyles[frequency],
        className
      )}
    >
      <span className="sm:hidden">{frequencyAbbreviations[frequency]}</span>
      <span className="hidden sm:inline">{frequency}</span>
    </span>
  )
}
