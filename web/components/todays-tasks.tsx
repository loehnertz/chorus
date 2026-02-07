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
}

export interface TodaysTasksProps {
  tasks: TodaysTask[]
  className?: string
}

export function TodaysTasks({ tasks, className }: TodaysTasksProps) {
  const router = useRouter()
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(
    () => new Set(tasks.filter((t) => t.completed).map((t) => t.scheduleId))
  )

  React.useEffect(() => {
    setCompletedIds(new Set(tasks.filter((t) => t.completed).map((t) => t.scheduleId)))
  }, [tasks])

  const setCompletion = async (task: TodaysTask, nextChecked: boolean) => {
    if (savingId) return

    const scheduleId = task.scheduleId
    const wasChecked = completedIds.has(scheduleId)
    if (wasChecked === nextChecked) return

    setSavingId(scheduleId)
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (nextChecked) next.add(scheduleId)
      else next.delete(scheduleId)
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
        setCompletedIds((prev) => {
          const next = new Set(prev)
          if (wasChecked) next.add(scheduleId)
          else next.delete(scheduleId)
          return next
        })
        toast.error(nextChecked ? 'Failed to record completion' : 'Failed to undo completion')
        return
      }

      if (nextChecked) toast.success('Completed!')
      else toast.message('Undone')

      router.refresh()
    } catch {
      setCompletedIds((prev) => {
        const next = new Set(prev)
        if (wasChecked) next.add(scheduleId)
        else next.delete(scheduleId)
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
        const checked = completedIds.has(task.scheduleId)
        const disabled = savingId === task.scheduleId
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
