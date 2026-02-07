'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RefreshCw, Sparkles } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { getCascadeSourceFrequency } from '@/lib/cascade'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FrequencyBadge } from '@/components/ui/frequency-badge'

export type SlotPickerChore = {
  id: string
  title: string
  description?: string | null
  frequency: Frequency
}

type SuggestResponse = {
  suggestion: null | {
    sourceFrequency: Frequency
    chore: {
      id: string
      title: string
      description: string | null
      frequency: Frequency
    }
  }
  paceWarnings?: Array<{ message: string }>
}

export interface SlotPickerProps {
  slotType: Frequency
  scheduledFor: string
  userId?: string
  sourceChores: SlotPickerChore[]
  existingChoreIds?: string[]
  onScheduled?: () => void
  className?: string
}

export function SlotPicker({
  slotType,
  scheduledFor,
  userId,
  sourceChores,
  existingChoreIds,
  onScheduled,
  className,
}: SlotPickerProps) {
  const router = useRouter()
  const sourceFrequency = getCascadeSourceFrequency(slotType)

  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [suggestedId, setSuggestedId] = React.useState<string | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [paceWarnings, setPaceWarnings] = React.useState<string[]>([])

  const existingSet = React.useMemo(() => new Set(existingChoreIds ?? []), [existingChoreIds])

  const selected = React.useMemo(
    () => sourceChores.find((c) => c.id === selectedId) ?? null,
    [selectedId, sourceChores]
  )

  const loadSuggestion = React.useCallback(async () => {
    if (!sourceFrequency) return

    setLoading(true)
    try {
      const res = await fetch('/api/schedules/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentFrequency: slotType, userId }),
      })

      if (!res.ok) {
        toast.error('Failed to load suggestion')
        return
      }

      const data = (await res.json()) as SuggestResponse
      const id = data.suggestion?.chore.id ?? null
      setSuggestedId(id)
      setPaceWarnings((data.paceWarnings ?? []).map((w) => w.message))

      setSelectedId((prev) => {
        if (!prev) return id
        return prev
      })
    } catch {
      toast.error('Failed to load suggestion')
    } finally {
      setLoading(false)
    }
  }, [slotType, sourceFrequency, userId])

  React.useEffect(() => {
    void loadSuggestion()
  }, [loadSuggestion])

  if (!sourceFrequency) return null

  const scheduleSelected = async () => {
    if (!selectedId) return
    if (saving) return
    if (existingSet.has(selectedId)) {
      toast.message('Already scheduled for this date')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choreId: selectedId,
          scheduledFor,
          slotType,
          suggested: selectedId === suggestedId,
        }),
      })

      if (!res.ok) {
        toast.error('Failed to schedule chore')
        return
      }

      toast.success('Added to schedule')
      onScheduled?.()
      router.refresh()
    } catch {
      toast.error('Failed to schedule chore')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide font-[var(--font-display)] text-[var(--foreground)]/50">
            Cascade pick
          </p>
          <p className="mt-1 text-sm font-[var(--font-display)] font-medium text-[var(--foreground)]">
            Pull 1 {sourceFrequency.charAt(0) + sourceFrequency.slice(1).toLowerCase()} chore into this {slotType.charAt(0) + slotType.slice(1).toLowerCase()} slot
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadSuggestion}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {paceWarnings.length ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-xs font-[var(--font-display)] font-medium text-[var(--foreground)]">
            Pace warning
          </p>
          <div className="mt-1 space-y-1">
            {paceWarnings.map((m) => (
              <p key={m} className="text-xs text-[var(--foreground)]/70">
                {m}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2">
        {sourceChores.length === 0 ? (
          <div className="col-span-full rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-4">
            <p className="text-sm text-[var(--foreground)]/60">No {sourceFrequency.toLowerCase()} chores available</p>
          </div>
        ) : (
          sourceChores
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((chore) => {
              const selected = chore.id === selectedId
              const suggested = chore.id === suggestedId
              const disabled = existingSet.has(chore.id)

              return (
                <button
                  key={chore.id}
                  type="button"
                  onClick={() => {
                    if (disabled) return
                    setSelectedId(chore.id)
                  }}
                  className={cn(
                    'group text-left rounded-[var(--radius-md)] border p-3 transition-colors',
                    disabled
                      ? 'cursor-not-allowed opacity-60 border-[var(--border)]'
                      : selected
                        ? 'border-[var(--color-terracotta)] bg-[var(--color-terracotta)]/10'
                        : 'border-[var(--border)] hover:bg-[var(--surface-2)]'
                  )}
                  aria-pressed={selected}
                  aria-disabled={disabled || undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-[var(--font-display)] font-medium text-[var(--foreground)]">
                        {chore.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--foreground)]/60">
                        {chore.description?.trim() ? chore.description : 'No description'}
                      </p>
                    </div>
                    {suggested ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-[var(--font-display)] text-[var(--foreground)]/70">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Suggested
                      </span>
                    ) : (
                      <FrequencyBadge frequency={chore.frequency} />
                    )}
                  </div>
                </button>
              )
            })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--foreground)]/60">
          {selected ? (
            <>
              Selected: <span className="font-[var(--font-display)]">{selected.title}</span>
            </>
          ) : (
            'Select a chore to schedule'
          )}
        </p>
        <Button type="button" onClick={scheduleSelected} disabled={!selectedId || saving || loading}>
          {saving ? 'Scheduling...' : 'Schedule'}
        </Button>
      </div>
    </div>
  )
}
