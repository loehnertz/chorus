import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleView } from '@/components/schedule-view'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('sonner', () => ({
  toast: {
    success: () => {},
    error: () => {},
    message: () => {},
  },
}))

jest.mock('@/components/slot-picker', () => ({
  SlotPicker: () => null,
}))

describe('ScheduleView', () => {
  it('switches selected day when clicking calendar cells', async () => {
    const user = userEvent.setup()

    render(
      <ScheduleView
        userId="u1"
        year={2026}
        monthIndex={1}
        initialSelectedDayKey="2026-02-06"
        chores={[
          { id: 'c1', title: 'Daily', frequency: 'DAILY', assigneeIds: [] },
          { id: 'c2', title: 'Daily 2', frequency: 'DAILY', assigneeIds: [] },
        ]}
        monthSchedules={[
          {
            id: 's1',
            scheduledFor: '2026-02-06T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c1', title: 'Daily', frequency: 'DAILY', assigneeIds: [] },
          },
          {
            id: 's2',
            scheduledFor: '2026-02-07T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c2', title: 'Daily 2', frequency: 'DAILY', assigneeIds: [] },
          },
        ]}
        upcomingSchedules={[]}
      />
    )

    const firstCheckbox = screen.getByRole('checkbox')
    expect(within(firstCheckbox.parentElement as HTMLElement).getByText('Daily')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Select 2026-02-07' }))

    const nextCheckbox = screen.getByRole('checkbox')
    expect(within(nextCheckbox.parentElement as HTMLElement).getByText('Daily 2')).toBeInTheDocument()
  })
})
