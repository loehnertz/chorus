import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleView } from '@/components/schedule-view'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

const toastSuccess = jest.fn()
const toastError = jest.fn()
const toastMessage = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    message: (...args: unknown[]) => toastMessage(...args),
  },
}))

jest.mock('@/components/slot-picker', () => ({
  SlotPicker: () => null,
}))

const defaultUsers = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
]

describe('ScheduleView', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockRefresh.mockReset()
    toastSuccess.mockReset()
    toastError.mockReset()
    toastMessage.mockReset()
    // @ts-expect-error - test env
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

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
        users={defaultUsers}
      />
    )

    const firstCheckbox = screen.getByRole('checkbox')
    expect(within(firstCheckbox.parentElement as HTMLElement).getByText('Daily')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Select 2026-02-07/ }))

    const nextCheckbox = screen.getByRole('checkbox')
    expect(within(nextCheckbox.parentElement as HTMLElement).getByText('Daily 2')).toBeInTheDocument()
  })

  it('adds a chore to the selected day', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 's-new',
        scheduledFor: '2026-02-06T00:00:00.000Z',
        slotType: 'DAILY',
        suggested: false,
        chore: { id: 'c1', title: 'Wash windows', description: null, frequency: 'DAILY' },
      }),
    })

    render(
      <ScheduleView
        userId="u1"
        year={2026}
        monthIndex={1}
        initialSelectedDayKey="2026-02-06"
        chores={[{ id: 'c1', title: 'Wash windows', frequency: 'DAILY', assigneeIds: [] }]}
        monthSchedules={[]}
        upcomingSchedules={[]}
        users={defaultUsers}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/schedules',
      expect.objectContaining({ method: 'POST' })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Added to schedule')
    expect(mockRefresh).toHaveBeenCalled()

    const checkbox = screen.getByRole('checkbox')
    expect(within(checkbox.parentElement as HTMLElement).getByText('Wash windows')).toBeInTheDocument()
  })

  it('removes a scheduled item', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

    render(
      <ScheduleView
        userId="u1"
        year={2026}
        monthIndex={1}
        initialSelectedDayKey="2026-02-06"
        chores={[{ id: 'c1', title: 'Wash windows', frequency: 'DAILY', assigneeIds: [] }]}
        monthSchedules={[
          {
            id: 's1',
            scheduledFor: '2026-02-06T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c1', title: 'Wash windows', frequency: 'DAILY', assigneeIds: [] },
          },
        ]}
        upcomingSchedules={[]}
        users={defaultUsers}
      />
    )

    expect(screen.getAllByRole('checkbox')).toHaveLength(1)

    await user.click(screen.getByLabelText('Remove'))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith('/api/schedules/s1', { method: 'DELETE' })
    expect(toastSuccess).toHaveBeenCalledWith('Removed')
    expect(mockRefresh).toHaveBeenCalled()

    await waitFor(() => expect(screen.queryAllByRole('checkbox')).toHaveLength(0))
  })

  it('shows tasks assigned to other users with de-emphasis', () => {
    render(
      <ScheduleView
        userId="u1"
        year={2026}
        monthIndex={1}
        initialSelectedDayKey="2026-02-06"
        chores={[
          { id: 'c1', title: 'My chore', frequency: 'DAILY', assigneeIds: ['u1'] },
          { id: 'c2', title: 'Their chore', frequency: 'DAILY', assigneeIds: ['u2'] },
        ]}
        monthSchedules={[
          {
            id: 's1',
            scheduledFor: '2026-02-06T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c1', title: 'My chore', frequency: 'DAILY', assigneeIds: ['u1'] },
          },
          {
            id: 's2',
            scheduledFor: '2026-02-06T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c2', title: 'Their chore', frequency: 'DAILY', assigneeIds: ['u2'] },
          },
        ]}
        upcomingSchedules={[]}
        users={defaultUsers}
      />
    )

    // Both tasks should be visible in the day view (there are also entries in the Plan section)
    const allMyChore = screen.getAllByText('My chore')
    const allTheirChore = screen.getAllByText('Their chore')
    expect(allMyChore.length).toBeGreaterThanOrEqual(1)
    expect(allTheirChore.length).toBeGreaterThanOrEqual(1)

    // The other user's task row in the day view should have opacity-60
    // Day view rows have the class pattern: flex items-center gap-4 py-4
    const dayRows = document.querySelectorAll('.py-4.gap-4')
    const theirRow = Array.from(dayRows).find((row) => row.textContent?.includes('Their chore'))
    expect(theirRow?.className).toContain('opacity-60')

    // Own task row should not have opacity-60
    const myRow = Array.from(dayRows).find((row) => row.textContent?.includes('My chore'))
    expect(myRow?.className).not.toContain('opacity-60')

    // Avatars should appear next to assigned chores
    expect(screen.getByLabelText('Bob')).toBeInTheDocument()
    expect(screen.getByLabelText('Alice')).toBeInTheDocument()
  })

  it('shows all upcoming tasks regardless of assignment', () => {
    render(
      <ScheduleView
        userId="u1"
        year={2026}
        monthIndex={1}
        initialSelectedDayKey="2026-02-06"
        chores={[
          { id: 'c1', title: 'My upcoming', frequency: 'DAILY', assigneeIds: ['u1'] },
          { id: 'c2', title: 'Their upcoming', frequency: 'DAILY', assigneeIds: ['u2'] },
          { id: 'c3', title: 'Unassigned upcoming', frequency: 'DAILY', assigneeIds: [] },
        ]}
        monthSchedules={[]}
        upcomingSchedules={[
          {
            id: 's1',
            scheduledFor: '2026-02-07T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c1', title: 'My upcoming', frequency: 'DAILY', assigneeIds: ['u1'] },
          },
          {
            id: 's2',
            scheduledFor: '2026-02-08T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c2', title: 'Their upcoming', frequency: 'DAILY', assigneeIds: ['u2'] },
          },
          {
            id: 's3',
            scheduledFor: '2026-02-09T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: false,
            chore: { id: 'c3', title: 'Unassigned upcoming', frequency: 'DAILY', assigneeIds: [] },
          },
        ]}
        users={defaultUsers}
      />
    )

    // All three upcoming tasks should be visible (may also appear in Plan section)
    expect(screen.getAllByText('My upcoming').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Their upcoming').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Unassigned upcoming').length).toBeGreaterThanOrEqual(1)
  })

  it('marks task as completed when any user completes it', () => {
    render(
      <ScheduleView
        userId="u1"
        year={2026}
        monthIndex={1}
        initialSelectedDayKey="2026-02-06"
        chores={[
          { id: 'c1', title: 'Shared chore', frequency: 'DAILY', assigneeIds: ['u1'] },
        ]}
        monthSchedules={[
          {
            id: 's1',
            scheduledFor: '2026-02-06T00:00:00.000Z',
            slotType: 'DAILY',
            suggested: false,
            completed: true,
            completedByUserId: 'u2',
            chore: { id: 'c1', title: 'Shared chore', frequency: 'DAILY', assigneeIds: ['u1'] },
          },
        ]}
        upcomingSchedules={[]}
        users={defaultUsers}
      />
    )

    // Task should show as completed
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()

    // Should show who completed it
    expect(screen.getByText(/completed by Bob/)).toBeInTheDocument()
  })
})
