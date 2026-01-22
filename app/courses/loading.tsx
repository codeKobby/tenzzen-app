import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function CoursesLoading() {
    return (
        <div className="h-full">
            {/* Sticky Header Skeleton */}
            <div className="sticky top-16 z-10 bg-background border-b">
                <div className="mx-auto px-4 max-w-6xl">
                    {/* Controls Bar */}
                    <div className="h-16 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-24 rounded-full" />
                        </div>

                        {/* Centered Search Bar */}
                        <div className="flex-1 flex justify-center max-w-2xl px-4">
                            <Skeleton className="h-10 w-full rounded-full" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-28 rounded-full" />
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="pb-3 flex gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-16 rounded-full shrink-0" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="py-8">
                <div className="mx-auto px-4 w-[95%] lg:w-[90%]">
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="group rounded-xl border bg-card overflow-hidden">
                                <Skeleton className="aspect-video w-full" />
                                <div className="p-4 space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="flex items-center justify-between pt-2">
                                        <Skeleton className="h-2 flex-1 mr-4" />
                                        <Skeleton className="h-4 w-10" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
