"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LessonItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-2 py-3 hover:bg-accent/50 rounded-md transition-colors">
            <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16" />
        </div>
    );
}

export function ModuleSectionSkeleton() {
    return (
        <div className="border rounded-lg">
            <div className="flex items-center justify-between p-4 bg-muted/50">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-4" />
            </div>
            <div className="p-3 space-y-2">
                <LessonItemSkeleton />
                <LessonItemSkeleton />
                <LessonItemSkeleton />
            </div>
        </div>
    );
}

export function CourseContentSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <ModuleSectionSkeleton key={i} />
            ))}
        </div>
    );
}

export function OverviewSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>

            <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
        </div>
    );
}

export function ResourcesSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
