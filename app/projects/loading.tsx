import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function ProjectsLoading() {
    return (
        <div className="h-full">
            {/* Sticky Header Skeleton */}
            <div className="sticky top-16 z-10 bg-background border-b">
                <div className="mx-auto px-4 max-w-6xl">
                    {/* Controls Bar */}
                    <div className="h-14 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-24 rounded-full" />
                        </div>

                        {/* Centered Search Bar */}
                        <div className="flex-1 flex justify-center max-w-[620px] mx-auto min-w-0">
                            <Skeleton className="h-10 w-full rounded-full" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-36 rounded-full" />
                        </div>
                    </div>

                    {/* Status Pills */}
                    <div className="pb-3 flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto space-y-6 pt-4 pb-12 w-[95%] lg:w-[90%]">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>

                <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card overflow-hidden">
                            <Skeleton className="h-40 w-full" />
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <Skeleton className="h-5 w-2/3" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <div className="flex items-center justify-between pt-2">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
