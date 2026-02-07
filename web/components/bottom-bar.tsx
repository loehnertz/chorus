'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/nav'

export interface BottomBarProps {
  className?: string
}

export function BottomBar({ className }: BottomBarProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 h-16 md:hidden',
        'bg-[var(--surface)] border-t border-[var(--border)]',
        'shadow-[0_-2px_8px_rgba(61,64,91,0.06)]',
        className
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-around px-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-3 py-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  active
                    ? 'text-[var(--color-terracotta)]'
                    : 'text-[var(--foreground)]/40'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-[10px] font-[var(--font-display)]',
                  active
                    ? 'text-[var(--color-terracotta)]'
                    : 'text-[var(--foreground)]/40'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
