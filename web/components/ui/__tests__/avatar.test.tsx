import { render, screen } from '@testing-library/react'
import { Avatar } from '@/components/ui/avatar'

describe('Avatar', () => {
  it('renders the first letter of the name', () => {
    render(<Avatar name="Alice" userId="user-1" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders at xs size', () => {
    render(<Avatar name="Bob" userId="user-2" size="xs" />)
    const el = screen.getByLabelText('Bob')
    expect(el.className).toContain('h-5')
    expect(el.className).toContain('w-5')
  })

  it('uses a deterministic color based on userId', () => {
    const { rerender } = render(<Avatar name="Alice" userId="same" />)
    const first = screen.getByLabelText('Alice')
    const firstClass = first.className
    rerender(<Avatar name="Alice" userId="same" />)
    const second = screen.getByLabelText('Alice')
    expect(second.className).toBe(firstClass)
  })
})
