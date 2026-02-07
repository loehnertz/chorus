import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoreCard } from '@/components/chore-card'

describe('ChoreCard', () => {
  it('renders title, frequency, and assignees', () => {
    render(
      <ChoreCard
        title="Vacuum"
        frequency="WEEKLY"
        description="Living room"
        assignees={[{ id: 'u1', name: 'Alice' }]}
        completionCount={3}
      />
    )

    expect(screen.getByText('Vacuum')).toBeInTheDocument()
    expect(screen.getByText('Weekly')).toBeInTheDocument()
    expect(screen.getByText('3 done')).toBeInTheDocument()
    expect(screen.getByLabelText('Alice')).toBeInTheDocument()
  })

  it('shows action menu and calls handlers', async () => {
    const user = userEvent.setup()
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(
      <ChoreCard
        title="Vacuum"
        frequency="WEEKLY"
        assignees={[]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    await user.click(screen.getByRole('button', { name: 'More' }))
    await user.click(await screen.findByText('Edit'))
    expect(onEdit).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'More' }))
    await user.click(await screen.findByText('Delete'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
