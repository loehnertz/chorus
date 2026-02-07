import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps {
  name: string
  userId: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

function hashStringToIndex(input: string, modulo: number) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash % modulo
}

const backgroundClasses = [
  'bg-[var(--color-terracotta)]',
  'bg-[var(--color-sage)]',
  'bg-[var(--color-charcoal)]',
]

const sizeClasses = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
} as const

export function Avatar({ name, userId, size = 'md', className }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase()
  const colorClass = backgroundClasses[hashStringToIndex(userId, backgroundClasses.length)]

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-[var(--font-display)] font-semibold text-white',
        sizeClasses[size],
        colorClass,
        className
      )}
      aria-label={name}
      title={name}
    >
      {initial}
    </div>
  )
}
