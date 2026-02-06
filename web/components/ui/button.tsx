import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[var(--color-terracotta)] text-white shadow-[var(--shadow-soft)] hover:opacity-90 hover:shadow-[var(--shadow-lifted)] hover:-translate-y-0.5':
              variant === 'default',
            'bg-[var(--color-sage)] text-white shadow-[var(--shadow-soft)] hover:opacity-90 hover:shadow-[var(--shadow-lifted)] hover:-translate-y-0.5':
              variant === 'secondary',
            'border-2 border-[var(--color-charcoal)] bg-transparent text-[var(--color-charcoal)] hover:bg-[var(--color-cream)]':
              variant === 'outline',
            'hover:bg-[var(--color-cream)] text-[var(--color-charcoal)]':
              variant === 'ghost',
          },
          {
            'h-11 px-6 py-2.5': size === 'default',
            'h-9 px-4 py-2 text-sm': size === 'sm',
            'h-12 px-8 py-3 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
