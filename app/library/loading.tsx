import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function LibraryLoading() {
    return (
        <div className="min-h-screen relative bg-background/50">
            <div className="relative z-10 h-full">
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
                                <Skeleton className="h-10 w-28 rounded-full" />
                            </div>
                        </div>

                        {/* Category Pills */}
                        <div className="pb-3 flex gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="mx-auto w-[95%] lg:w-[90%] pt-4 pb-12">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-5 w-5 rounded" />
                                </div>
                                <Skeleton className="h-4 w-1/3" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
