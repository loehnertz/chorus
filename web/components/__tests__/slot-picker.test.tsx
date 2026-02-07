import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SlotPicker } from '@/components/slot-picker'

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

describe('SlotPicker', () => {
  it('loads suggestion and schedules it', async () => {
    const user = userEvent.setup()

    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestion: {
            sourceFrequency: 'WEEKLY',
            chore: {
              id: 'c1',
              title: 'Weekly chore',
              description: null,
              frequency: 'WEEKLY',
            },
          },
          paceWarnings: [],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <SlotPicker
        slotType="DAILY"
        scheduledFor="2026-02-06T00:00:00.000Z"
        userId="u1"
        sourceChores={[{ id: 'c1', title: 'Weekly chore', frequency: 'WEEKLY' }]}
      />
    )

    const scheduleButton = screen.getByRole('button', { name: 'Schedule' })
    expect(scheduleButton).toBeDisabled()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/schedules/suggest',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ currentFrequency: 'DAILY', userId: 'u1' }),
      })
    )

    await waitFor(() => expect(scheduleButton).toBeEnabled())
    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()

    await user.click(scheduleButton)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/schedules',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          choreId: 'c1',
          scheduledFor: '2026-02-06T00:00:00.000Z',
          slotType: 'DAILY',
          suggested: true,
        }),
      })
    )

    globalThis.fetch = originalFetch
  })

  it('schedules a manually selected chore as non-suggested', async () => {
    const user = userEvent.setup()

    const originalFetch = globalThis.fetch
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestion: {
            sourceFrequency: 'WEEKLY',
            chore: {
              id: 'c1',
              title: 'Suggested',
              description: null,
              frequency: 'WEEKLY',
            },
          },
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true } as unknown as Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).fetch = fetchMock

    render(
      <SlotPicker
        slotType="DAILY"
        scheduledFor="2026-02-06T00:00:00.000Z"
        sourceChores={[
          { id: 'c1', title: 'Suggested', frequency: 'WEEKLY' },
          { id: 'c2', title: 'Manual', frequency: 'WEEKLY' },
        ]}
      />
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const manualTitle = screen.getByText('Manual')
    const manualButton = manualTitle.closest('button')
    expect(manualButton).toBeTruthy()
    await user.click(manualButton!)

    expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Schedule' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/schedules',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          choreId: 'c2',
          scheduledFor: '2026-02-06T00:00:00.000Z',
          slotType: 'DAILY',
          suggested: false,
        }),
      })
    )

    globalThis.fetch = originalFetch
  })
})
