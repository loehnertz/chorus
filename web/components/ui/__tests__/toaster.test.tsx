import { render, screen, waitFor } from '@testing-library/react'
import { Toaster } from '@/components/ui/toaster'

jest.mock('sonner', () => ({
  Toaster: (props: { position: string }) => (
    <div data-testid="sonner" data-position={props.position} />
  ),
}))

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('Toaster', () => {
  it('uses bottom-center on mobile', async () => {
    mockMatchMedia(false)
    render(<Toaster />)

    await waitFor(() => {
      expect(screen.getByTestId('sonner')).toHaveAttribute('data-position', 'bottom-center')
    })
  })

  it('uses bottom-right on desktop', async () => {
    mockMatchMedia(true)
    render(<Toaster />)

    await waitFor(() => {
      expect(screen.getByTestId('sonner')).toHaveAttribute('data-position', 'bottom-right')
    })
  })
})
