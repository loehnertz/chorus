import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Frequency } from '@prisma/client'
import { ScheduleCalendar } from '../schedule-calendar'

describe('ScheduleCalendar', () => {
  it('renders schedules grouped by day and supports actions', async () => {
    const user = userEvent.setup()
    const onComplete = jest.fn()
    const onDelete = jest.fn()

    render(
      <ScheduleCalendar
        schedules={[
          {
            id: 'schedule-1',
            scheduledFor: '2025-01-10T18:00:00.000Z',
            slotType: Frequency.WEEKLY,
            suggested: true,
            chore: {
              id: 'chore-1',
              title: 'Dishes',
              description: null,
              frequency: Frequency.DAILY,
              assignments: [],
              _count: {
                completions: 0,
                schedules: 1,
              },
            },
          },
        ]}
        onComplete={onComplete}
        onDelete={onDelete}
      />
    )

    expect(screen.getByText('Dishes')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Mark Dishes complete' }))
    expect(onComplete).toHaveBeenCalledWith('chore-1', 'schedule-1')

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('schedule-1')
  })
})
