import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonText className="h-7 w-40" />
        <SkeletonText className="h-4 w-80" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Skeleton className="h-[420px] w-full rounded-[var(--radius-lg)]" />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <Skeleton className="h-[380px] w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    </div>
  )
}
