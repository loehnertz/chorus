import { render, screen } from '@testing-library/react'
import { FrequencyBadge } from '@/components/ui/frequency-badge'
import type { Frequency } from '@/types/frequency'

describe('FrequencyBadge', () => {
  it('renders the frequency label and abbreviated label', () => {
    render(<FrequencyBadge frequency={'DAILY' as Frequency} />)
    expect(screen.getByText('Daily')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('applies distinct variant styling per frequency', () => {
    const { rerender } = render(<FrequencyBadge frequency={'DAILY' as Frequency} />)
    expect(screen.getByText('Daily').parentElement).toHaveClass('text-[var(--color-terracotta)]')

    rerender(<FrequencyBadge frequency={'WEEKLY' as Frequency} />)
    expect(screen.getByText('Weekly').parentElement).toHaveClass('text-[var(--color-sage)]')

    rerender(<FrequencyBadge frequency={'MONTHLY' as Frequency} />)
    expect(screen.getByText('Monthly').parentElement).toHaveClass('text-[var(--foreground)]')

    rerender(<FrequencyBadge frequency={'YEARLY' as Frequency} />)
    expect(screen.getByText('Annual').parentElement).toHaveClass('bg-[var(--color-cream)]')
  })

  it('renders intermediate frequency badges correctly', () => {
    const { rerender } = render(<FrequencyBadge frequency={'BIWEEKLY' as Frequency} />)
    expect(screen.getByText('Bi-weekly')).toBeInTheDocument()
    expect(screen.getByText('BW')).toBeInTheDocument()

    rerender(<FrequencyBadge frequency={'BIMONTHLY' as Frequency} />)
    expect(screen.getByText('Bi-monthly')).toBeInTheDocument()
    expect(screen.getByText('BM')).toBeInTheDocument()

    rerender(<FrequencyBadge frequency={'SEMIANNUAL' as Frequency} />)
    expect(screen.getByText('Semi-annual')).toBeInTheDocument()
    expect(screen.getByText('SA')).toBeInTheDocument()
  })
})
