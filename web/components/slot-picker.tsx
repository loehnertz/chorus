'use client'

import { useEffect, useMemo, useState } from 'react'
import { Frequency } from '@prisma/client'
import { Button } from '@/components/ui/button'
import type { ScheduleWithChore } from '@/types'

interface SlotPickerProps {
  availableChores: Array<{
    id: string
    title: string
    frequency: Frequency
  }>
  onScheduleCreated: (schedule: ScheduleWithChore) => void
}

interface SuggestionPayload {
  data?: {
    chore: {
      id: string
      title: string
    }
    lastCompletedAt: string | null
  }
  error?: string
}

const SLOT_OPTIONS: Frequency[] = [Frequency.WEEKLY, Frequency.MONTHLY]

const COMPATIBILITY: Record<Frequency, Frequency[]> = {
  DAILY: [],
  WEEKLY: [Frequency.DAILY, Frequency.MONTHLY],
  MONTHLY: [Frequency.YEARLY],
  YEARLY: [],
}

function toDateTimeLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export function SlotPicker({ availableChores, onScheduleCreated }: SlotPickerProps) {
  const [slotType, setSlotType] = useState<Frequency>(Frequency.WEEKLY)
  const [scheduledFor, setScheduledFor] = useState(toDateTimeLocalInputValue(new Date()))
  const [manualMode, setManualMode] = useState(false)
  const [manualChoreId, setManualChoreId] = useState('')
  const [suggestedChore, setSuggestedChore] = useState<{ id: string; title: string; lastCompletedAt: string | null } | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const compatibleChores = useMemo(
    () => availableChores.filter((chore) => COMPATIBILITY[slotType].includes(chore.frequency)),
    [availableChores, slotType]
  )

  const loadSuggestion = async () => {
    setLoadingSuggestion(true)
    setError('')

    try {
      const response = await fetch('/api/schedules/suggest', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ slotType }),
      })

      const payload = (await response.json()) as SuggestionPayload
      if (!response.ok || !payload.data) {
        setSuggestedChore(null)
        setError(payload.error || 'No suggestion available for this slot')
        return
      }

      setSuggestedChore({
        id: payload.data.chore.id,
        title: payload.data.chore.title,
        lastCompletedAt: payload.data.lastCompletedAt,
      })
      setManualChoreId(payload.data.chore.id)
    } catch {
      setError('Could not load suggestion')
      setSuggestedChore(null)
    } finally {
      setLoadingSuggestion(false)
    }
  }

  useEffect(() => {
    void loadSuggestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotType])

  const createSlot = async () => {
    setError('')

    if (!scheduledFor) {
      setError('Please choose a date and time')
      return
    }

    if (manualMode && !manualChoreId) {
      setError('Select a chore for manual mode')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scheduledFor: new Date(scheduledFor).toISOString(),
          slotType,
          ...(manualMode ? { choreId: manualChoreId, suggested: false } : {}),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setError(payload.error || 'Failed to create slot')
        return
      }

      onScheduleCreated(payload.data as ScheduleWithChore)
    } catch {
      setError('Failed to create slot')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor="slot-type" className="text-sm font-medium text-[var(--color-charcoal)]">
            Slot Type
          </label>
          <select
            id="slot-type"
            className="h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-charcoal)]/20 bg-white px-3 text-sm"
            value={slotType}
            onChange={(event) => setSlotType(event.target.value as Frequency)}
          >
            {SLOT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label htmlFor="scheduled-for" className="text-sm font-medium text-[var(--color-charcoal)]">
            Scheduled For
          </label>
          <input
            id="scheduled-for"
            type="datetime-local"
            className="h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-charcoal)]/20 px-3 text-sm"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="manual-mode"
          type="checkbox"
          checked={manualMode}
          onChange={(event) => setManualMode(event.target.checked)}
        />
        <label htmlFor="manual-mode" className="text-sm text-[var(--color-charcoal)]">
          Manual override
        </label>
      </div>

      {manualMode ? (
        <div className="space-y-1">
          <label htmlFor="manual-chore" className="text-sm font-medium text-[var(--color-charcoal)]">
            Choose chore
          </label>
          <select
            id="manual-chore"
            className="h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-charcoal)]/20 bg-white px-3 text-sm"
            value={manualChoreId}
            onChange={(event) => setManualChoreId(event.target.value)}
          >
            <option value="">Select a chore</option>
            {compatibleChores.map((chore) => (
              <option key={chore.id} value={chore.id}>
                {chore.title} ({chore.frequency})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-charcoal)]/10 bg-[var(--color-cream)]/50 p-3 text-sm">
          <p className="font-medium text-[var(--color-charcoal)]">Suggested chore</p>
          <p className="text-[var(--color-charcoal)]/80">
            {loadingSuggestion
              ? 'Loading suggestion...'
              : suggestedChore
                ? `${suggestedChore.title}${
                  suggestedChore.lastCompletedAt
                    ? ` (last done ${new Date(suggestedChore.lastCompletedAt).toLocaleDateString('en-US')})`
                    : ' (never completed)'
                }`
                : 'No suggestion available'}
          </p>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => void loadSuggestion()}>
            Refresh Suggestion
          </Button>
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}

      <Button type="button" onClick={() => void createSlot()} disabled={isSubmitting}>
        {isSubmitting ? 'Creating Slot...' : 'Create Slot'}
      </Button>
    </div>
  )
}
