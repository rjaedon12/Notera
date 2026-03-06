"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-xl glass-shimmer", className)}
      style={{
        border: "1px solid var(--glass-border)",
      }}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-6 glass-shimmer" style={{ border: "1px solid var(--glass-border)" }}>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SetCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 glass-shimmer" style={{ border: "1px solid var(--glass-border)" }}>
      <Skeleton className="h-5 w-2/3 mb-3" />
      <Skeleton className="h-4 w-1/3 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}
