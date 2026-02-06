'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { cn } from '@/lib/utils'
import { buildMonthGridUtc, getMonthTitleUtc, getTodayDayKeyUtc } from '@/lib/calendar'
import { dayKeyUtc } from '@/lib/date'
import { getCascadeSourceFrequency } from '@/lib/cascade'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FrequencyBadge } from '@/components/ui/frequency-badge'
import { CompletionCheckbox } from '@/components/completion-checkbox'
import { SlotPicker, type SlotPickerChore } from '@/components/slot-picker'

export type ScheduleViewChore = {
  id: string
  title: string
  description?: string | null
  frequency: Frequency
  assigneeIds: string[]
}

export type ScheduleViewItem = {
  id: string
  scheduledFor: string
  slotType: Frequency
  suggested: boolean
  completed: boolean
  chore: {
    id: string
    title: string
    description?: string | null
    frequency: Frequency
    assigneeIds: string[]
  }
}

export interface ScheduleViewProps {
  userId: string
  year: number
  monthIndex: number
  initialSelectedDayKey?: string
  chores: ScheduleViewChore[]
  monthSchedules: ScheduleViewItem[]
  upcomingSchedules: ScheduleViewItem[]
  className?: string
}

const VIEW_MODES: Array<'DAILY' | 'WEEKLY' | 'MONTHLY'> = ['DAILY', 'WEEKLY', 'MONTHLY']

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toMonthParam(year: number, monthIndex: number) {
  return `${year}-${pad2(monthIndex + 1)}`
}

function dayKeyToUtcIso(dayKey: string) {
  return `${dayKey}T00:00:00.000Z`
}

function formatDayTitleUtc(dayKey: string) {
  const dt = new Date(`${dayKey}T00:00:00.000Z`)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt)
}

function isAssignedOrUnassigned(assigneeIds: string[], userId: string) {
  return assigneeIds.length === 0 || assigneeIds.includes(userId)
}

export function ScheduleView({
  userId,
  year,
  monthIndex,
  initialSelectedDayKey,
  chores,
  monthSchedules,
  upcomingSchedules,
  className,
}: ScheduleViewProps) {
  const router = useRouter()

  const [selectedDayKey, setSelectedDayKey] = React.useState(
    initialSelectedDayKey ?? getTodayDayKeyUtc()
  )
  const [viewMode, setViewMode] = React.useState<(typeof VIEW_MODES)[number]>('DAILY')
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [items, setItems] = React.useState<ScheduleViewItem[]>(monthSchedules)
  const [upcoming, setUpcoming] = React.useState<ScheduleViewItem[]>(upcomingSchedules)

  React.useEffect(() => {
    setItems(monthSchedules)
  }, [monthSchedules])

  React.useEffect(() => {
    setUpcoming(upcomingSchedules)
  }, [upcomingSchedules])

  React.useEffect(() => {
    const cell = buildMonthGridUtc({ year, monthIndex }).find((c) => c.dayKey === selectedDayKey)
    if (!cell?.inMonth) {
      setSelectedDayKey(dayKeyUtc(new Date(Date.UTC(year, monthIndex, 1))))
    }
  }, [year, monthIndex, selectedDayKey])

  const monthTitle = getMonthTitleUtc(year, monthIndex)
  const grid = React.useMemo(() => buildMonthGridUtc({ year, monthIndex }), [year, monthIndex])

  const countsByDay = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of items) {
      const key = dayKeyUtc(new Date(s.scheduledFor))
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [items])

  const selectedDayItems = React.useMemo(() => {
    return items
      .filter((s) => dayKeyUtc(new Date(s.scheduledFor)) === selectedDayKey)
      .sort((a, b) => a.chore.title.localeCompare(b.chore.title))
  }, [items, selectedDayKey])

  const planChores = React.useMemo(() => {
    return chores
      .filter((c) => c.frequency === viewMode)
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [chores, viewMode])

  const cascadeSource = getCascadeSourceFrequency(viewMode)
  const cascadeChores: SlotPickerChore[] = React.useMemo(() => {
    if (!cascadeSource) return []
    return chores
      .filter((c) => c.frequency === cascadeSource)
      .map((c) => ({ id: c.id, title: c.title, description: c.description, frequency: c.frequency }))
  }, [chores, cascadeSource])

  const existingChoreIdsForSelectedDay = React.useMemo(() => {
    return selectedDayItems.map((s) => s.chore.id)
  }, [selectedDayItems])

  const gotoMonth = (targetYear: number, targetMonthIndex: number) => {
    const month = toMonthParam(targetYear, targetMonthIndex)
    const url = `/schedule?month=${encodeURIComponent(month)}`
    router.push(url)
    // Some Next.js versions can treat searchParam-only pushes as shallow.
    // Refresh ensures the server component re-runs with the new query.
    setTimeout(() => router.refresh(), 0)
  }

  const prevMonth = () => {
    const dt = new Date(Date.UTC(year, monthIndex, 1))
    dt.setUTCMonth(dt.getUTCMonth() - 1)
    gotoMonth(dt.getUTCFullYear(), dt.getUTCMonth())
  }
  const nextMonth = () => {
    const dt = new Date(Date.UTC(year, monthIndex, 1))
    dt.setUTCMonth(dt.getUTCMonth() + 1)
    gotoMonth(dt.getUTCFullYear(), dt.getUTCMonth())
  }

  const createSchedule = async (choreId: string, opts?: { suggested?: boolean }) => {
    if (savingId) return

    const scheduledFor = dayKeyToUtcIso(selectedDayKey)
    const already = selectedDayItems.some((s) => s.chore.id === choreId)
    if (already) {
      toast.message('Already scheduled for this date')
      return
    }

    setSavingId(`create:${choreId}`)
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choreId,
          scheduledFor,
          slotType: viewMode,
          suggested: opts?.suggested ?? false,
        }),
      })
      if (!res.ok) {
        toast.error('Failed to add to schedule')
        return
      }

      const created = (await res.json()) as {
        id: string
        scheduledFor: string
        slotType: Frequency
        suggested: boolean
        chore: {
          id: string
          title: string
          description?: string | null
          frequency: Frequency
        }
      }

      const nextItem: ScheduleViewItem = {
        id: created.id,
        scheduledFor: created.scheduledFor,
        slotType: created.slotType,
        suggested: created.suggested,
        completed: false,
        chore: {
          ...created.chore,
          assigneeIds: chores.find((c) => c.id === created.chore.id)?.assigneeIds ?? [],
        },
      }

      setItems((prev) => [...prev, nextItem])
      if (isAssignedOrUnassigned(nextItem.chore.assigneeIds, userId)) {
        setUpcoming((prev) => [...prev, nextItem])
      }

      toast.success('Added to schedule')
      router.refresh()
    } catch {
      toast.error('Failed to add to schedule')
    } finally {
      setSavingId(null)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (savingId) return
    const ok = window.confirm('Remove this scheduled item?')
    if (!ok) return

    setSavingId(`delete:${scheduleId}`)
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        toast.error('Failed to remove schedule item')
        return
      }
      setItems((prev) => prev.filter((s) => s.id !== scheduleId))
      setUpcoming((prev) => prev.filter((s) => s.id !== scheduleId))
      toast.success('Removed')
      router.refresh()
    } catch {
      toast.error('Failed to remove schedule item')
    } finally {
      setSavingId(null)
    }
  }

  const markDone = async (task: ScheduleViewItem) => {
    if (savingId) return
    if (task.completed) return

    setSavingId(`complete:${task.id}`)
    setItems((prev) => prev.map((s) => (s.id === task.id ? { ...s, completed: true } : s)))
    setUpcoming((prev) => prev.map((s) => (s.id === task.id ? { ...s, completed: true } : s)))

    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choreId: task.chore.id, scheduleId: task.id }),
      })

      if (!res.ok) {
        setItems((prev) => prev.map((s) => (s.id === task.id ? { ...s, completed: false } : s)))
        setUpcoming((prev) => prev.map((s) => (s.id === task.id ? { ...s, completed: false } : s)))
        toast.error('Failed to record completion')
        return
      }

      toast.success('Completed!')
      router.refresh()
    } catch {
      setItems((prev) => prev.map((s) => (s.id === task.id ? { ...s, completed: false } : s)))
      setUpcoming((prev) => prev.map((s) => (s.id === task.id ? { ...s, completed: false } : s)))
      toast.error('Failed to record completion')
    } finally {
      setSavingId(null)
    }
  }

  const viewChipBase =
    'px-3 py-1.5 rounded-full text-sm font-[var(--font-display)] font-medium cursor-pointer transition-colors'

  return (
    <div className={cn('space-y-7 md:space-y-8', className)}>
      <div>
        <h1 className="text-2xl md:text-3xl font-[var(--font-display)] font-bold text-[var(--foreground)]">
          Schedule
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground)]/70">
          Plan slots and accept cascade suggestions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl md:text-2xl">{monthTitle}</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]',
                    'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]/70',
                    'hover:bg-[var(--surface-2)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2'
                  )}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]',
                    'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]/70',
                    'hover:bg-[var(--surface-2)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2'
                  )}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-xs font-[var(--font-display)] text-[var(--foreground)]/50">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="px-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {grid.map((cell) => {
                  const selected = cell.dayKey === selectedDayKey
                  const count = countsByDay[cell.dayKey] ?? 0
                  return (
                    <button
                      key={cell.dayKey}
                      type="button"
                      onClick={() => {
                        if (!cell.inMonth) return
                        setSelectedDayKey(cell.dayKey)
                      }}
                      disabled={!cell.inMonth}
                      aria-label={`Select ${cell.dayKey}`}
                      className={cn(
                        'relative flex h-12 flex-col items-start justify-between rounded-[var(--radius-md)] border px-2 py-1.5 text-left',
                        cell.inMonth
                          ? 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                          : 'border-transparent bg-transparent opacity-40',
                        selected && 'border-[var(--color-terracotta)] bg-[var(--color-terracotta)]/10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2'
                      )}
                    >
                      <span className="text-sm font-[var(--font-display)] text-[var(--foreground)]">
                        {cell.date.getUTCDate()}
                      </span>
                      {count ? (
                        <span className="text-[10px] text-[var(--foreground)]/60">{count} item</span>
                      ) : (
                        <span className="text-[10px] text-[var(--foreground)]/40">&nbsp;</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.filter((u) => isAssignedOrUnassigned(u.chore.assigneeIds, userId)).length === 0 ? (
                <p className="text-sm text-[var(--foreground)]/50">No upcoming tasks.</p>
              ) : (
                <div className="space-y-3">
                  {upcoming
                    .filter((u) => isAssignedOrUnassigned(u.chore.assigneeIds, userId))
                    .slice()
                    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                    .slice(0, 8)
                    .map((u) => {
                      const key = dayKeyUtc(new Date(u.scheduledFor))
                      return (
                        <div key={u.id} className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-[var(--font-display)] text-[var(--foreground)]">
                              {u.chore.title}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--foreground)]/50">{formatDayTitleUtc(key)}</p>
                          </div>
                          <FrequencyBadge frequency={u.chore.frequency} />
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">{formatDayTitleUtc(selectedDayKey)}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayItems.length === 0 ? (
                <EmptyState
                  icon={Plus}
                  title="Nothing scheduled"
                  subtitle="Plan slots for this day using the controls below."
                />
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {selectedDayItems.map((task) => {
                    const disabled = task.completed || savingId === `complete:${task.id}`
                    return (
                      <div key={task.id} className="flex items-center gap-4 py-4">
                        <CompletionCheckbox
                          checked={task.completed}
                          disabled={disabled}
                          onCheckedChange={() => markDone(task)}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-sm font-[var(--font-display)] font-medium',
                              task.completed
                                ? 'text-[var(--foreground)]/50 line-through'
                                : 'text-[var(--foreground)]'
                            )}
                          >
                            {task.chore.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--foreground)]/50">
                            Slot: {task.slotType.toLowerCase()}
                            {task.suggested ? ' · suggested' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FrequencyBadge frequency={task.chore.frequency} />
                          <button
                            type="button"
                            onClick={() => deleteSchedule(task.id)}
                            className={cn(
                              'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
                              'text-red-600 hover:bg-red-600/10',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2'
                            )}
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={cn(
                      viewChipBase,
                      viewMode === mode
                        ? 'bg-[var(--color-terracotta)] text-white'
                        : 'bg-[var(--surface)] text-[var(--foreground)]/60 border border-[var(--border-strong)] hover:border-[var(--foreground)]/30'
                    )}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide font-[var(--font-display)] text-[var(--foreground)]/50">
                  {viewMode.toLowerCase()} chores
                </p>
                {planChores.length === 0 ? (
                  <p className="text-sm text-[var(--foreground)]/50">
                    No {viewMode.toLowerCase()} chores yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {planChores.map((chore) => {
                      const scheduled = selectedDayItems.some((s) => s.chore.id === chore.id)
                      return (
                        <div
                          key={chore.id}
                          className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-[var(--font-display)] font-medium text-[var(--foreground)]">
                              {chore.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[var(--foreground)]/60">
                              {chore.description?.trim() ? chore.description : 'No description'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={scheduled ? 'outline' : 'default'}
                            onClick={() => {
                              if (scheduled) {
                                const existing = selectedDayItems.find((s) => s.chore.id === chore.id)
                                if (existing) void deleteSchedule(existing.id)
                                return
                              }
                              void createSchedule(chore.id)
                            }}
                            disabled={!!savingId}
                          >
                            {scheduled ? 'Remove' : 'Add'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {cascadeSource ? (
                <SlotPicker
                  slotType={viewMode}
                  scheduledFor={dayKeyToUtcIso(selectedDayKey)}
                  userId={userId}
                  sourceChores={cascadeChores}
                  existingChoreIds={existingChoreIdsForSelectedDay}
                  onScheduled={() => {
                    // Keep the list responsive while server refreshes.
                    void Promise.resolve()
                  }}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
