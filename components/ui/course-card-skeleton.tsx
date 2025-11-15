"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseCardSkeletonProps {
  className?: string;
}

export function CourseCardSkeleton({ className }: CourseCardSkeletonProps) {
  return (
    <div className={cn("rounded-lg overflow-hidden border border-border bg-card", className)}>
      {/* Thumbnail */}
      <div className="aspect-video bg-muted animate-pulse" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-muted animate-pulse rounded-md w-3/4" />
        
        {/* Description */}
        <div className="h-4 bg-muted animate-pulse rounded-md w-1/2" />
        <div className="h-4 bg-muted animate-pulse rounded-md w-full" />
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-muted animate-pulse rounded-full w-20" />
          <div className="h-4 bg-muted animate-pulse rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
