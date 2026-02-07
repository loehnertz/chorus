'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CompletionCheckboxProps {
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function CompletionCheckbox({
  checked,
  disabled,
  onCheckedChange,
  className,
}: CompletionCheckboxProps) {
  const toggle = () => {
    if (disabled) return
    onCheckedChange(!checked)
  }

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={toggle}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
      className={cn(
        'h-8 w-8 shrink-0 rounded-full border-2',
        'inline-flex items-center justify-center',
        'transition-colors duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-terracotta)] focus-visible:ring-offset-2',
        disabled && 'opacity-50 !cursor-not-allowed',
        checked
          ? 'bg-[var(--color-sage)] border-[var(--color-sage)] text-white'
          : 'bg-[var(--surface)] border-[var(--border-strong)] hover:border-[var(--color-sage)] hover:bg-[var(--color-sage)]/5',
        className
      )}
      animate={checked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
      // Motion spring/inertia only support two keyframes; use a tween keyframe bounce.
      transition={
        checked
          ? { duration: 0.25, ease: 'easeOut' }
          : { duration: 0.15, ease: 'easeOut' }
      }
    >
      <motion.span
        initial={false}
        animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.8 }}
        transition={{ duration: 0.15 }}
      >
        <Check className="h-4 w-4" aria-hidden="true" />
      </motion.span>
      <span className="sr-only">{checked ? 'Completed' : 'Mark complete'}</span>
    </motion.button>
  )
}
