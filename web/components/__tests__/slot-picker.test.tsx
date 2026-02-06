import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Frequency } from '@prisma/client'
import { SlotPicker } from '../slot-picker'

describe('SlotPicker', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('loads suggestion and creates slot', async () => {
    const user = userEvent.setup()
    const onScheduleCreated = jest.fn()

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            chore: {
              id: 'chore-1',
              title: 'Dishes',
            },
            lastCompletedAt: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
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
              _count: { completions: 0, schedules: 0 },
            },
          },
        }),
      })

    render(
      <SlotPicker
        availableChores={[
          { id: 'chore-1', title: 'Dishes', frequency: Frequency.DAILY },
          { id: 'chore-2', title: 'Deep Clean', frequency: Frequency.YEARLY },
        ]}
        onScheduleCreated={onScheduleCreated}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Suggested chore/i)).toBeInTheDocument()
      expect(screen.getByText(/Dishes/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Create Slot' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/schedules', expect.objectContaining({ method: 'POST' }))
      expect(onScheduleCreated).toHaveBeenCalledTimes(1)
    })
  })
})
