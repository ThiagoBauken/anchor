import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Skeleton Loaders for common components
function SkeletonCard() {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  )
}

function SkeletonAvatar() {
  return <Skeleton className="h-12 w-12 rounded-full" />
}

function SkeletonButton() {
  return <Skeleton className="h-10 w-20 rounded-md" />
}

function SkeletonInput() {
  return <Skeleton className="h-10 w-full rounded-md" />
}

// Specialized skeletons for app components
function SkeletonPointCard() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

function SkeletonMap() {
  return (
    <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
      <div className="absolute top-4 left-4">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="absolute bottom-4 right-4 space-y-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

function SkeletonProject() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

export { 
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonPointCard,
  SkeletonMap,
  SkeletonProject
}
