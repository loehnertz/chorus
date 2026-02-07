'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ClipboardList, Plus } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { FREQUENCIES } from '@/types/frequency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ChoreCard } from '@/components/chore-card'
import { ChoreForm } from '@/components/chore-form'
import { PageFadeIn } from '@/components/page-fade-in'

export type ChoresViewUser = { id: string; name: string; image?: string | null }

export type ChoresViewChore = {
  id: string
  title: string
  description?: string | null
  frequency: Frequency
  completionCount: number
  assignees: { id: string; name: string; image?: string | null }[]
}

export interface ChoresViewProps {
  chores: ChoresViewChore[]
  users: ChoresViewUser[]
}

type FrequencyFilter = 'ALL' | Frequency

export function ChoresView({ chores, users }: ChoresViewProps) {
  const router = useRouter()

  const [filter, setFilter] = React.useState<FrequencyFilter>('ALL')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ChoresViewChore | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<ChoresViewChore | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    if (filter === 'ALL') return chores
    return chores.filter((c) => c.frequency === filter)
  }, [chores, filter])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (chore: ChoresViewChore) => {
    setEditing(chore)
    setFormOpen(true)
  }

  const deleteChore = async (chore: ChoresViewChore) => {
    if (deletingId) return
    setDeletingId(chore.id)
    try {
      const res = await fetch(`/api/chores/${chore.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete chore')
        return
      }

      toast.success('Chore deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete chore')
    } finally {
      setDeletingId(null)
    }
  }

  const requestDelete = (chore: ChoresViewChore) => {
    if (deletingId) return
    setConfirmDelete(chore)
  }

  const chipBase =
    'px-3 py-1.5 rounded-full text-sm font-[var(--font-display)] font-medium cursor-pointer transition-colors'

  return (
    <PageFadeIn className="space-y-7 md:space-y-8">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-[var(--font-display)] font-bold text-[var(--foreground)]">
            Chores
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground)]/70">
            Manage the household chore pool.
          </p>
        </div>

        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Chore
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            chipBase,
            filter === 'ALL'
              ? 'bg-[var(--color-terracotta)] text-white'
              : 'bg-[var(--surface)] text-[var(--foreground)]/60 border border-[var(--border-strong)] hover:border-[var(--foreground)]/30'
          )}
          onClick={() => setFilter('ALL')}
        >
          All
        </button>
        {FREQUENCIES.map((f) => (
          <button
            key={f}
            type="button"
            className={cn(
              chipBase,
              filter === f
                ? 'bg-[var(--color-terracotta)] text-white'
                : 'bg-[var(--surface)] text-[var(--foreground)]/60 border border-[var(--border-strong)] hover:border-[var(--foreground)]/30'
            )}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {chores.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No chores yet"
          subtitle="Add your first chore to get started"
          ctaLabel="Add Chore"
          onCtaClick={openCreate}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No chores match"
          subtitle="Try a different frequency filter"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filtered.map((c, idx) => (
                <ChoreCard
                  key={c.id}
              title={c.title}
              description={c.description}
              frequency={c.frequency}
              assignees={c.assignees}
                  completionCount={c.completionCount}
                  index={idx}
                  onEdit={() => openEdit(c)}
                  onDelete={() => requestDelete(c)}
                />
              ))}
            </div>
          )}

      <ChoreForm
        open={formOpen}
        onOpenChange={setFormOpen}
        users={users}
        initialValues={
          editing
            ? {
                id: editing.id,
                title: editing.title,
                description: editing.description,
                frequency: editing.frequency,
                assigneeIds: editing.assignees.map((u) => u.id),
              }
            : undefined
        }
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
        title="Delete chore?"
        description={
          confirmDelete
            ? `Delete \"${confirmDelete.title}\"? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        confirmDisabled={!confirmDelete || !!deletingId}
        onConfirm={async () => {
          if (!confirmDelete) return
          await deleteChore(confirmDelete)
        }}
      />
    </PageFadeIn>
  )
}
