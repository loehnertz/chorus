import Link from 'next/link'
import { cn } from '@/lib/utils'

export type DashboardStatsData = {
  completedTotal: number
  completedThisWeek: number
  streakDays: number
  choresCount: number
}

export interface DashboardStatsProps {
  stats: DashboardStatsData
  className?: string
}

function StatCard({
  label,
  value,
  sub,
  subTone = 'neutral',
  href,
}: {
  label: string
  value: number
  sub?: string
  subTone?: 'neutral' | 'positive'
  href?: string
}) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-wide font-[var(--font-display)] text-[var(--foreground)]/50">
        {label}
      </p>
      <p className="mt-1 text-3xl font-[var(--font-display)] font-bold text-[var(--foreground)]">
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            'mt-1 text-xs',
            subTone === 'positive'
              ? 'text-[var(--color-sage)]'
              : 'text-[var(--foreground)]/50'
          )}
        >
          {sub}
        </p>
      ) : null}
    </>
  )

  const cardClass = cn(
    'bg-[var(--surface)] rounded-[var(--radius-md)] p-4 sm:p-5 shadow-[var(--shadow-soft)] border border-[var(--border)]',
    href && 'cursor-pointer hover:shadow-[var(--shadow-lifted)] hover:-translate-y-0.5 transition-all duration-200'
  )

  if (href) {
    return (
      <Link href={href} prefetch={false} className={cardClass}>
        {content}
      </Link>
    )
  }

  return <div className={cardClass}>{content}</div>
}

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5', className)}>
      <StatCard
        label="Completed"
        value={stats.completedTotal}
        sub={`+${stats.completedThisWeek} this week`}
        subTone={stats.completedThisWeek > 0 ? 'positive' : 'neutral'}
      />
      <StatCard label="This Week" value={stats.completedThisWeek} sub="since Monday" />
      <StatCard
        label="Streak"
        value={stats.streakDays}
        sub={stats.streakDays > 0 ? 'consecutive days' : 'start today'}
        subTone={stats.streakDays > 0 ? 'positive' : 'neutral'}
      />
      <StatCard label="Chores" value={stats.choresCount} sub="in the pool" href="/chores" />
    </div>
  )
}
