import { render, screen } from '@testing-library/react'
import { HistoryView } from '@/components/history-view'

describe('HistoryView', () => {
  it('renders an empty state', () => {
    render(<HistoryView currentUserId="u1" scope="mine" items={[]} />)

    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('No completions yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mine' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Household' })).toBeInTheDocument()
  })

  it('shows household items with user labels', () => {
    render(
      <HistoryView
        currentUserId="me"
        scope="household"
        items={[
          {
            id: 'c1',
            title: 'Vacuum',
            frequency: 'WEEKLY',
            completedAtLabel: '2026-02-07 12:00',
            scheduleId: 's1',
            notes: null,
            user: { id: 'me', name: 'Alice' },
          },
          {
            id: 'c2',
            title: 'Dishes',
            frequency: 'DAILY',
            completedAtLabel: '2026-02-07 12:05',
            scheduleId: null,
            notes: 'Kitchen only',
            user: { id: 'u2', name: 'Bob' },
          },
        ]}
      />
    )

    expect(screen.getByText('Vacuum')).toBeInTheDocument()
    expect(screen.getByText('Dishes')).toBeInTheDocument()
    expect(screen.getByText(/You - 2026-02-07 12:00 - scheduled/)).toBeInTheDocument()
    expect(screen.getByText(/Bob - 2026-02-07 12:05/)).toBeInTheDocument()
    expect(screen.getByText('Kitchen only')).toBeInTheDocument()
  })
})
