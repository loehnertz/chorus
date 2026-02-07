'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FrequencyBadge } from '@/components/ui/frequency-badge'
import { Avatar } from '@/components/ui/avatar'

export type HistoryItem = {
  id: string
  title: string
  frequency: Frequency
  completedAtLabel: string
  scheduleId: string | null
  notes: string | null
  user: { id: string; name: string; image?: string | null }
}

export interface HistoryViewProps {
  currentUserId: string
  scope: 'mine' | 'household'
  items: HistoryItem[]
  className?: string
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.05 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export function HistoryView({ currentUserId, scope, items, className }: HistoryViewProps) {
  const title = scope === 'mine' ? 'Your completion history' : 'Household completion history'
  const subtitle =
    scope === 'mine'
      ? 'Everything you have checked off recently.'
      : 'A shared timeline of what got done.'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('space-y-7 md:space-y-8', className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-[var(--font-display)] font-bold text-[var(--foreground)]">
            History
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground)]/70">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant={scope === 'mine' ? 'default' : 'outline'} size="sm">
            <Link href="/history?scope=mine" prefetch={false}>
              Mine
            </Link>
          </Button>
          <Button asChild variant={scope === 'household' ? 'default' : 'outline'} size="sm">
            <Link
              href="/history?scope=household"
              prefetch={false}
            >
              Household
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={History}
              title="No completions yet"
              subtitle={scope === 'mine' ? "Check off a task to start a streak." : 'Complete a task to start the timeline.'}
            />
          ) : (
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
              {items.map((item) => {
                const isMe = item.user.id === currentUserId
                return (
                  <motion.div
                    key={item.id}
                    variants={rowVariants}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <Avatar
                        name={item.user.name}
                        userId={item.user.id}
                        imageUrl={item.user.image ?? null}
                        size="xs"
                        className="mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-[var(--font-display)] text-[var(--foreground)]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--foreground)]/50">
                          {scope === 'household' ? `${isMe ? 'You' : item.user.name} · ` : ''}
                          {item.completedAtLabel}
                          {item.scheduleId ? ' · scheduled' : ''}
                        </p>
                        {item.notes?.trim() ? (
                          <p className="mt-1 text-xs text-[var(--foreground)]/60 line-clamp-2">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <FrequencyBadge frequency={item.frequency} />
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
