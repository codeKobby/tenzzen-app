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
      <div className="aspect-video relative overflow-hidden bg-muted">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton shimmer className="h-5 w-3/4" />
        
        {/* Description */}
        <Skeleton shimmer className="h-4 w-1/2" />
        <Skeleton shimmer className="h-4 w-full" />
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton shimmer className="h-4 w-20 rounded-full" />
          <Skeleton shimmer className="h-4 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
