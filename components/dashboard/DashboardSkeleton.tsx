"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Skeleton for the hero section stats cards
 */
export function HeroStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg bg-primary-foreground/10 p-3 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg bg-primary-foreground/20" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-3 w-16 bg-primary-foreground/20" />
                            <Skeleton className="h-5 w-10 bg-primary-foreground/20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton for the streak badge in the hero section
 */
export function StreakBadgeSkeleton() {
    return (
        <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full bg-primary-foreground/20" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-16 bg-primary-foreground/20" />
                    <Skeleton className="h-3 w-12 bg-primary-foreground/20" />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for a single course card in Continue Learning section
 */
export function CourseCardSkeleton({ isFirst = false }: { isFirst?: boolean }) {
    return (
        <div className={`group rounded-lg border bg-card p-4 ${isFirst ? 'border-primary/30 bg-primary/5' : ''}`}>
            <div className="flex gap-4">
                {/* Thumbnail skeleton */}
                <Skeleton className="relative aspect-video w-28 shrink-0 rounded-lg sm:w-36" />

                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                        <Skeleton className="h-5 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                    <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-2 flex-1" />
                            <Skeleton className="h-3 w-10" />
                        </div>
                        <Skeleton className={`h-9 w-full rounded-md ${isFirst ? 'bg-primary/20' : ''}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}


/**
 * Skeleton for the Learning Journey card with multiple courses
 */
export function LearningJourneySkeleton({ count = 2 }: { count?: number }) {
    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-36" />
                </div>
                <Skeleton className="h-7 w-20 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <CourseCardSkeleton key={i} isFirst={i === 0} />
                ))}
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton for the recommended courses section
 */
export function RecommendedCoursesSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
            </div>
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="rounded-md border p-4 space-y-3 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-5 w-14 rounded-full" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-3.5 w-16" />
                                    <Skeleton className="h-3.5 w-14" />
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                <Skeleton className="h-4 w-20 rounded" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


/**
 * Skeleton for the recent notes section
 */
export function RecentNotesSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
            </div>
            <div className="p-4 space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                    </div>
                ))}
                <Skeleton className="h-8 w-full rounded-md" />
            </div>
        </div>
    );
}

/**
 * Full dashboard skeleton for initial page load
 */
export function DashboardSkeleton() {
    return (
        <div className="mx-auto space-y-6 pt-6 w-full lg:w-[90%] px-4 sm:px-6 max-w-[1400px] animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/80 to-primary/60 p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 flex items-center">
                        <Skeleton className="h-10 w-64 bg-primary-foreground/20" />
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
                            <StreakBadgeSkeleton />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="flex-1 h-10 rounded-md bg-white/20" />
                            <Skeleton className="flex-1 h-10 rounded-md bg-white/20" />
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <HeroStatsSkeleton />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="mt-6 grid gap-6 md:grid-cols-3">
                {/* Left Column - Continue Learning & Chart (md:col-span-2) */}
                <div className="space-y-6 md:col-span-2 flex flex-col">
                    <LearningJourneySkeleton count={2} />

                    {/* Activity Chart Skeleton */}
                    <div className="rounded-xl border bg-card p-6">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>

                    {/* Recommended Courses Skeleton - Moved from right column */}
                    <RecommendedCoursesSkeleton count={2} />
                </div>

                {/* Right Column - Calendar, SRS, Notes, Recommendations (md:col-span-1) */}
                <div className="space-y-6 flex flex-col">
                    {/* Calendar Skeleton */}
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-5 w-24" />
                            <div className="flex gap-1">
                                <Skeleton className="h-8 w-8 rounded" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-md" />
                            ))}
                        </div>
                    </div>

                    {/* SRS Widget Skeleton */}
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="h-5 w-5 rounded" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>

                    {/* Notes */}
                    <RecentNotesSkeleton />
                </div>
            </div>
        </div>
    );
}

