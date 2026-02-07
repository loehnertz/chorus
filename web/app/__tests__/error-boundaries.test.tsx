import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalError from '@/app/error'
import DashboardError from '@/app/(dashboard)/error'

describe('Error boundaries', () => {
  it('GlobalError calls reset', async () => {
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<GlobalError error={new Error('boom')} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('DashboardError calls reset', async () => {
    const user = userEvent.setup()
    const reset = jest.fn()

    render(<DashboardError error={new Error('boom')} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
