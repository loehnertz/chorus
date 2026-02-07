'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Frequency } from '@/types/frequency'
import { FrequencyBadge } from '@/components/ui/frequency-badge'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ChoreCardAssignee = { id: string; name: string; image?: string | null }

export interface ChoreCardProps {
  title: string
  description?: string | null
  frequency: Frequency
  assignees: ChoreCardAssignee[]
  completionCount?: number
  index?: number
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function ChoreCard({
  title,
  description,
  frequency,
  assignees,
  completionCount,
  index = 0,
  onClick,
  onEdit,
  onDelete,
  className,
}: ChoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-[var(--shadow-soft)]',
        'hover:shadow-[var(--shadow-lifted)] transition-shadow duration-200',
        'border border-transparent hover:border-[var(--border)]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <FrequencyBadge frequency={frequency} />

        {onEdit || onDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] cursor-pointer',
                  'text-[var(--foreground)]/60 hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2'
                )}
                aria-label="More"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {onEdit ? (
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {onEdit && onDelete ? <DropdownMenuSeparator /> : null}
              {onDelete ? (
                <DropdownMenuItem destructive onSelect={onDelete}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <h3 className="text-lg font-[var(--font-display)] font-semibold text-[var(--foreground)] line-clamp-1">
        {title}
      </h3>
      <p className={cn(
        'mt-1 text-sm font-[var(--font-body)] text-[var(--foreground)]/70',
        'line-clamp-2'
      )}>
        {description?.trim() ? description : 'No description'}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--foreground)]/60">
        <div className="flex items-center gap-2">
          <span className="shrink-0">Assigned:</span>
          {assignees.length ? (
            <div className="flex -space-x-1.5">
              {assignees.slice(0, 4).map((u) => (
                <Avatar
                  key={u.id}
                  name={u.name}
                  userId={u.id}
                  imageUrl={u.image ?? null}
                  size="sm"
                  className="ring-2 ring-white"
                />
              ))}
            </div>
          ) : (
            /* Invisible avatar-sized spacer keeps the row the same height as when avatars are present */
            <div className="flex items-center">
              <div className="h-7 w-0 shrink-0" aria-hidden="true" />
              <span className="text-[var(--foreground)]/50">Unassigned</span>
            </div>
          )}
        </div>

        {typeof completionCount === 'number' ? (
          <span>{completionCount} done</span>
        ) : null}
      </div>
    </motion.div>
  )
}
