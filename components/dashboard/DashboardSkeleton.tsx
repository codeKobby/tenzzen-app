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
 * Skeleton for a single course card in Learning Journey
 */
export function CourseCardSkeleton() {
    return (
        <div className="group rounded-lg border bg-card p-3 mb-4">
            <div className="flex gap-3">
                {/* Thumbnail skeleton */}
                <Skeleton className="relative aspect-video w-32 shrink-0 rounded-md sm:w-40" />

                <div className="flex-1 space-y-2">
                    {/* Title and button row */}
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-8 w-16 rounded-md" />
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-1.5 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for the Learning Journey card with multiple courses
 */
export function LearningJourneySkeleton({ count = 3 }: { count?: number }) {
    return (
        <Card className="relative overflow-hidden flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-7 w-28 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <CourseCardSkeleton key={i} />
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
            <div className="p-4 flex items-center gap-2 border-b">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-36" />
            </div>
            <div className="p-4 space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-5 w-14 rounded ml-auto" />
                        </div>
                    </div>
                ))}
                <Skeleton className="h-8 w-full rounded-md" />
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
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/80 to-primary/60 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                        <Skeleton className="h-8 w-64 bg-primary-foreground/20" />
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="rounded-lg bg-white/10 p-3.5">
                            <StreakBadgeSkeleton />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="flex-1 h-10 rounded-md bg-white/90" />
                            <Skeleton className="flex-1 h-10 rounded-md bg-white/90" />
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <HeroStatsSkeleton />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column - Learning Journey & Chart */}
                <div className="space-y-6 md:col-span-2">
                    <LearningJourneySkeleton count={2} />
                    <Skeleton className="h-80 w-full rounded-xl" />
                </div>

                {/* Right Column - Calendar, Notes, Recommendations */}
                <div className="space-y-6">
                    <Skeleton className="h-96 w-full rounded-xl" />
                    <RecentNotesSkeleton />
                    <RecommendedCoursesSkeleton />
                </div>
            </div>
        </div>
    );
}
