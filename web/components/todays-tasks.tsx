'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Frequency } from '@/types/frequency'
import { cn } from '@/lib/utils'
import { CompletionCheckbox } from '@/components/completion-checkbox'
import { FrequencyBadge } from '@/components/ui/frequency-badge'

export type TodaysTask = {
  scheduleId: string
  choreId: string
  title: string
  frequency: Frequency
  completed: boolean
  completedByUserId?: string | null
}

export interface TodaysTasksProps {
  userId: string
  tasks: TodaysTask[]
  className?: string
}

export function TodaysTasks({ userId, tasks, className }: TodaysTasksProps) {
  const router = useRouter()
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [completionById, setCompletionById] = React.useState<Record<string, string | null>>(() => {
    const next: Record<string, string | null> = {}
    for (const t of tasks) {
      if (!t.completed) continue
      next[t.scheduleId] = t.completedByUserId ?? null
    }
    return next
  })

  React.useEffect(() => {
    const next: Record<string, string | null> = {}
    for (const t of tasks) {
      if (!t.completed) continue
      next[t.scheduleId] = t.completedByUserId ?? null
    }
    setCompletionById(next)
  }, [tasks])

  const setCompletion = async (task: TodaysTask, nextChecked: boolean) => {
    if (savingId) return

    const scheduleId = task.scheduleId
    const wasChecked = Object.prototype.hasOwnProperty.call(completionById, scheduleId)
    const prevCompletedByUserId = wasChecked ? (completionById[scheduleId] ?? null) : null
    if (wasChecked === nextChecked) return

    const canUndo = wasChecked && prevCompletedByUserId === userId
    if (!nextChecked && !canUndo) return

    setSavingId(scheduleId)
    setCompletionById((prev) => {
      const next = { ...prev }
      if (nextChecked) next[scheduleId] = userId
      else delete next[scheduleId]
      return next
    })

    try {
      const res = nextChecked
        ? await fetch('/api/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choreId: task.choreId, scheduleId }),
          })
        : await fetch(`/api/completions?scheduleId=${encodeURIComponent(scheduleId)}`, {
            method: 'DELETE',
          })

      if (!res.ok) {
        setCompletionById((prev) => {
          const next = { ...prev }
          if (wasChecked) next[scheduleId] = prevCompletedByUserId
          else delete next[scheduleId]
          return next
        })
        toast.error(nextChecked ? 'Failed to record completion' : 'Failed to undo completion')
        return
      }

      if (nextChecked) toast.success('Completed!')
      else toast.message('Undone')

      router.refresh()
    } catch {
      setCompletionById((prev) => {
        const next = { ...prev }
        if (wasChecked) next[scheduleId] = prevCompletedByUserId
        else delete next[scheduleId]
        return next
      })
      toast.error(nextChecked ? 'Failed to record completion' : 'Failed to undo completion')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className={cn('divide-y divide-[var(--border)]', className)}>
      {tasks.map((task) => {
        const completedBy = completionById[task.scheduleId] ?? null
        const checked = Object.prototype.hasOwnProperty.call(completionById, task.scheduleId)
        const canUndo = checked && completedBy === userId
        const disabled = savingId === task.scheduleId || (checked && !canUndo)
        return (
          <div key={task.scheduleId} className="flex items-center gap-4 py-4 sm:py-5">
            <CompletionCheckbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(next) => setCompletion(task, next)}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm font-[var(--font-display)] font-medium',
                  checked
                    ? 'text-[var(--foreground)]/50 line-through'
                    : 'text-[var(--foreground)]'
                )}
              >
                {task.title}
              </p>
            </div>
            <FrequencyBadge frequency={task.frequency} />
          </div>
        )
      })}
    </div>
  )
}
