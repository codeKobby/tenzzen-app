"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({
  className,
  shimmer = false,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        shimmer
          ? "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent"
          : "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

interface CourseSkeletonProps {
  className?: string;
}

function CourseSkeleton({ className }: CourseSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Title and subtitle */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>

      {/* Overview section */}
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>

      {/* Lessons section */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-10 w-[90%]" />
              <Skeleton className="h-10 w-[85%]" />
            </div>
          </div>
        ))}
      </div>

      {/* Resources and tests section */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-8 w-[100px]" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-[80px]" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export { Skeleton, CourseSkeleton };
