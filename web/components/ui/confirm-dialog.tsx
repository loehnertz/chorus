'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  confirmDisabled,
  onConfirm,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) setSubmitting(false)
  }, [open])

  const handleConfirm = async () => {
    if (submitting) return
    if (confirmDisabled) return

    setSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled || submitting}
            className={cn(
              destructive &&
                'bg-red-600 text-white hover:opacity-100 hover:bg-red-600/90 focus-visible:ring-red-600'
            )}
          >
            {submitting ? 'Working...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
