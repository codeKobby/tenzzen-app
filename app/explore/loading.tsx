import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function ExploreLoading() {
    return (
        <div className="h-full">
            {/* Fixed Header Skeleton */}
            <div className="sticky top-16 z-10 bg-background">
                <div className="mx-auto w-[95%] lg:w-[90%]">
                    {/* Controls Bar */}
                    <div className="h-14 flex items-center justify-between gap-4">
                        {/* Left Side: Filters */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-24 rounded-full" />
                        </div>

                        {/* Center: Search Bar */}
                        <div className="flex-1 flex justify-center max-w-[620px] mx-auto min-w-0">
                            <div className="flex w-full items-center">
                                <Skeleton className="h-10 w-full rounded-l-full" />
                                <Skeleton className="h-10 w-14 rounded-r-full" />
                            </div>
                        </div>

                        {/* Right Side: Primary Action */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-40 rounded-full" />
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="py-2 sm:py-3 flex gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto space-y-8 pt-4 pb-12 w-[95%] lg:w-[90%]">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="group rounded-xl border bg-card overflow-hidden">
                            <Skeleton className="aspect-video w-full" />
                            <div className="p-4 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex items-center gap-2 pt-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

