import type { LucideIcon } from 'lucide-react'
import { CalendarDays, ClipboardList, History, LayoutDashboard } from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chores', label: 'Chores', icon: ClipboardList },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/history', label: 'History', icon: History },
]
