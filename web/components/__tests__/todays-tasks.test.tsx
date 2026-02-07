import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodaysTasks } from '@/components/todays-tasks'

const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

const toastSuccess = jest.fn()
const toastError = jest.fn()
const toastMessage = jest.fn()

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    message: (...args: unknown[]) => toastMessage(...args),
  },
}))

describe('TodaysTasks', () => {
  beforeEach(() => {
    mockRefresh.mockReset()
    toastSuccess.mockReset()
    toastError.mockReset()
    toastMessage.mockReset()
    // @ts-expect-error - test env
    global.fetch = jest.fn()
  })

  it('records a completion and refreshes', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

    render(
      <TodaysTasks
        tasks={[
          {
            scheduleId: 's1',
            choreId: 'c1',
            title: 'Dishes',
            frequency: 'DAILY',
            completed: false,
          },
        ]}
      />
    )

    await user.click(screen.getByRole('checkbox'))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/completions',
      expect.objectContaining({ method: 'POST' })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Completed!')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows an error toast if completion fails', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })

    render(
      <TodaysTasks
        tasks={[
          {
            scheduleId: 's1',
            choreId: 'c1',
            title: 'Dishes',
            frequency: 'DAILY',
            completed: false,
          },
        ]}
      />
    )

    await user.click(screen.getByRole('checkbox'))

    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(toastError).toHaveBeenCalledWith('Failed to record completion')
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('can undo a completion and refreshes', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

    render(
      <TodaysTasks
        tasks={[
          {
            scheduleId: 's1',
            choreId: 'c1',
            title: 'Dishes',
            frequency: 'DAILY',
            completed: true,
          },
        ]}
      />
    )

    await user.click(screen.getByRole('checkbox'))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith('/api/completions?scheduleId=s1', { method: 'DELETE' })
    expect(toastMessage).toHaveBeenCalledWith('Undone')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows an error toast if undo fails', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })

    render(
      <TodaysTasks
        tasks={[
          {
            scheduleId: 's1',
            choreId: 'c1',
            title: 'Dishes',
            frequency: 'DAILY',
            completed: true,
          },
        ]}
      />
    )

    await user.click(screen.getByRole('checkbox'))

    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(toastError).toHaveBeenCalledWith('Failed to undo completion')
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
