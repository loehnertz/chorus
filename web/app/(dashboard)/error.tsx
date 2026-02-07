'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageFadeIn } from '@/components/page-fade-in'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <PageFadeIn className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Dashboard error</CardTitle>
          <CardDescription>
            We could not load this part of the dashboard. Try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-sm text-[var(--foreground)]/70">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>If this keeps happening, refresh the page.</span>
          </div>

          {process.env.NODE_ENV === 'development' ? (
            <pre className="mt-4 overflow-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)]/80">
              {error.message}
            </pre>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => reset()}>
              Try again
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard" prefetch={false}>
                Back to dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageFadeIn>
  )
}
