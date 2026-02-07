'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/nav'
import { Avatar } from '@/components/ui/avatar'
import { authClient } from '@/lib/auth/client'

export interface SidebarProps {
  user: { id: string; name: string; image?: string | null }
  className?: string
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col',
        'bg-[var(--surface)] border-r border-[var(--border)]',
        className
      )}
    >
      <div className="flex h-full flex-col p-5">
        <Link
          href="/dashboard"
          prefetch={false}
          className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5"
            aria-hidden="true"
          />
          <span className="text-xl font-bold font-[var(--font-display)] text-[var(--color-terracotta)]">
            Chorus
          </span>
        </Link>

        <nav className="mt-7 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5',
                  'text-sm font-[var(--font-display)] font-medium transition-colors duration-150',
                  active
                    ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                    : 'text-[var(--foreground)]/60 hover:bg-[var(--surface-2)]/50'
                )}
              >
                <span
                  className={cn(
                    'h-5 w-1 rounded-full',
                    active ? 'bg-[var(--color-terracotta)]' : 'bg-transparent'
                  )}
                  aria-hidden="true"
                />
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-5 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={user.name} userId={user.id} imageUrl={user.image ?? null} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-[var(--font-display)] font-medium text-[var(--foreground)]">
                {user.name}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(
                  'mt-0.5 inline-flex items-center gap-1 text-xs',
                  'text-[var(--foreground)]/50 hover:text-[var(--color-terracotta)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2 rounded'
                )}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
