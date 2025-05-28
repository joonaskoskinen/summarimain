import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonResult() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Content Type Badge */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Summary */}
      <div>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      {/* Key Points */}
      <div>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      {/* Action Items */}
      <div>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
