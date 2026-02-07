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
      />
    )

    const firstCheckbox = screen.getByRole('checkbox')
    expect(within(firstCheckbox.parentElement as HTMLElement).getByText('Daily')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Select 2026-02-07' }))

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
})
