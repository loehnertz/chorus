import { render, screen } from '@testing-library/react'
import { FrequencyBadge } from '@/components/ui/frequency-badge'
import type { Frequency } from '@/types/frequency'

describe('FrequencyBadge', () => {
  it('renders the frequency label and abbreviated label', () => {
    render(<FrequencyBadge frequency={'DAILY' as Frequency} />)
    expect(screen.getByText('DAILY')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('applies distinct variant styling per frequency', () => {
    const { rerender } = render(<FrequencyBadge frequency={'DAILY' as Frequency} />)
    expect(screen.getByText('DAILY').parentElement).toHaveClass('text-[var(--color-terracotta)]')

    rerender(<FrequencyBadge frequency={'WEEKLY' as Frequency} />)
    expect(screen.getByText('WEEKLY').parentElement).toHaveClass('text-[var(--color-sage)]')

    rerender(<FrequencyBadge frequency={'MONTHLY' as Frequency} />)
    expect(screen.getByText('MONTHLY').parentElement).toHaveClass('text-[var(--foreground)]')

    rerender(<FrequencyBadge frequency={'YEARLY' as Frequency} />)
    expect(screen.getByText('YEARLY').parentElement).toHaveClass('bg-[var(--color-cream)]')
  })
})
