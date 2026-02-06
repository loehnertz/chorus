'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScheduleCalendar } from '@/components/schedule-calendar'
import { SlotPicker } from '@/components/slot-picker'
import type { ScheduleWithChore } from '@/types'
import { Frequency } from '@prisma/client'

interface ScheduleWorkspaceProps {
  initialSchedules: ScheduleWithChore[]
  availableChores: Array<{
    id: string
    title: string
    frequency: Frequency
  }>
}

export function ScheduleWorkspace({ initialSchedules, availableChores }: ScheduleWorkspaceProps) {
  const [schedules, setSchedules] = useState(
    [...initialSchedules].sort(
      (left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()
    )
  )
  const [error, setError] = useState('')

  const upcomingCount = useMemo(() => schedules.length, [schedules])

  const handleScheduleCreated = (schedule: ScheduleWithChore) => {
    setSchedules((current) =>
      [...current, schedule].sort(
        (left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()
      )
    )
  }

  const handleCompletion = async (choreId: string, scheduleId: string) => {
    setError('')

    const response = await fetch('/api/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ choreId, scheduleId }),
    })

    const payload = await response.json()
    if (!response.ok) {
      setError(payload.error || 'Could not complete scheduled chore')
      return
    }

    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId))
  }

  const handleDelete = async (scheduleId: string) => {
    setError('')

    const response = await fetch(`/api/schedules/${scheduleId}`, {
      method: 'DELETE',
    })

    const payload = await response.json()
    if (!response.ok) {
      setError(payload.error || 'Could not delete schedule')
      return
    }

    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <SlotPicker availableChores={availableChores} onScheduleCreated={handleScheduleCreated} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[var(--color-charcoal)]">Upcoming Schedule</h2>
        <span className="text-sm text-[var(--color-charcoal)]/70">{upcomingCount} slots</span>
      </div>

      {error ? (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      <ScheduleCalendar schedules={schedules} onComplete={handleCompletion} onDelete={handleDelete} />
    </div>
  )
}
