'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { FREQUENCIES, FREQUENCY_LABELS } from '@/types/frequency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { FrequencyBadge } from '@/components/ui/frequency-badge'

export type ChoreFormUser = { id: string; name: string; image?: string | null }

export type ChoreFormInitialValues = {
  id: string
  title: string
  description?: string | null
  frequency: Frequency
  assigneeIds: string[]
}

type FieldErrors = Partial<Record<'title' | 'description' | 'frequency' | 'assigneeIds', string>> & {
  form?: string
}

function getFieldErrorsFromResponse(json: unknown): FieldErrors {
  if (!json || typeof json !== 'object') return {}

  const anyJson = json as {
    error?: unknown
    details?: {
      fieldErrors?: Record<string, unknown>
      formErrors?: unknown
    }
  }

  const fieldErrors = anyJson.details?.fieldErrors
  const formErrors = anyJson.details?.formErrors

  const out: FieldErrors = {}

  const pickFirst = (value: unknown) => {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    if (typeof value === 'string') return value
    return undefined
  }

  if (fieldErrors && typeof fieldErrors === 'object') {
    out.title = pickFirst(fieldErrors.title)
    out.description = pickFirst(fieldErrors.description)
    out.frequency = pickFirst(fieldErrors.frequency)
    out.assigneeIds = pickFirst(fieldErrors.assigneeIds)
  }

  const formMsg = pickFirst(formErrors)
  if (formMsg) out.form = formMsg
  if (!out.form && typeof anyJson.error === 'string') out.form = anyJson.error

  return out
}

export interface ChoreFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: ChoreFormUser[]
  initialValues?: ChoreFormInitialValues
  onSaved?: () => void
}

export function ChoreForm({ open, onOpenChange, users, initialValues, onSaved }: ChoreFormProps) {
  const isEdit = Boolean(initialValues)

  const [title, setTitle] = React.useState(initialValues?.title ?? '')
  const [description, setDescription] = React.useState(initialValues?.description ?? '')
  const [frequency, setFrequency] = React.useState<Frequency>(initialValues?.frequency ?? 'WEEKLY')
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>(initialValues?.assigneeIds ?? [])
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setTitle(initialValues?.title ?? '')
    setDescription(initialValues?.description ?? '')
    setFrequency(initialValues?.frequency ?? 'WEEKLY')
    setAssigneeIds(initialValues?.assigneeIds ?? [])
    setErrors({})
    setSaving(false)
  }, [open, initialValues])

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const validate = () => {
    const next: FieldErrors = {}
    if (!title.trim()) next.title = 'Title is required'
    if (!FREQUENCIES.includes(frequency)) next.frequency = 'Frequency is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!validate()) return

    setSaving(true)

    const payload = {
      title,
      description,
      frequency,
      assigneeIds,
    }

    try {
      const res = await fetch(isEdit ? `/api/chores/${initialValues!.id}` : '/api/chores', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        setErrors(getFieldErrorsFromResponse(json))
        toast.error(isEdit ? 'Failed to update chore' : 'Failed to create chore')
        setSaving(false)
        return
      }

      toast.success(isEdit ? 'Chore updated!' : 'Chore created!')
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong' })
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)]">
            {isEdit ? 'Edit Chore' : 'Add Chore'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update details and assignees for this chore.'
              : 'Create a new chore for your household.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {errors.form ? (
            <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errors.form}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-sm font-medium font-[var(--font-display)] text-[var(--foreground)]">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Vacuum the living room"
              aria-required="true"
              disabled={saving}
            />
            {errors.title ? <p className="text-xs text-red-600 mt-0.5">{errors.title}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium font-[var(--font-display)] text-[var(--foreground)]">
              Description
            </label>
            <Textarea
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details or notes..."
              disabled={saving}
            />
            {errors.description ? (
              <p className="text-xs text-red-600 mt-0.5">{errors.description}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium font-[var(--font-display)] text-[var(--foreground)]">
              Frequency
            </label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    <div className="flex items-center gap-2">
                      <FrequencyBadge frequency={f} />
                      <span>{FREQUENCY_LABELS[f]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency ? (
              <p className="text-xs text-red-600 mt-0.5">{errors.frequency}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium font-[var(--font-display)] text-[var(--foreground)]">
              Assignees
            </label>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
              <div className="grid grid-cols-1 gap-2">
                {users.length ? (
                  users.map((u) => {
                    const checked = assigneeIds.includes(u.id)
                    return (
                      <label
                        key={u.id}
                        className={cn(
                          'flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2',
                          'hover:bg-[var(--surface-2)]/50'
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleAssignee(u.id)}
                          aria-label={`Assign to ${u.name}`}
                          disabled={saving}
                        />
                        <Avatar name={u.name} userId={u.id} imageUrl={u.image ?? null} size="sm" />
                        <span className="text-sm font-[var(--font-display)] text-[var(--foreground)]">
                          {u.name}
                        </span>
                      </label>
                    )
                  })
                ) : (
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/50">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add another user to assign chores.
                  </div>
                )}
              </div>
            </div>
            {errors.assigneeIds ? (
              <p className="text-xs text-red-600 mt-0.5">{errors.assigneeIds}</p>
            ) : null}
          </div>

          <DialogFooter className="flex justify-between sm:justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
