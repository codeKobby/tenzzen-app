import { Skeleton } from "@/components/ui/skeleton"

export function VideoContentSkeleton() {
    return (
        <div className="space-y-4 pb-2 p-4">
            <div className="space-y-4">
                {/* Video/Playlist header */}
                <div className="flex gap-4">
                    {/* Thumbnail skeleton */}
                    <div className="flex-shrink-0">
                        <Skeleton className="w-28 aspect-video rounded-lg" />
                    </div>

                    <div className="flex-1 space-y-2">
                        {/* Title skeleton */}
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-3/4" />

                        {/* Channel info skeleton */}
                        <div className="flex items-center gap-2 mt-1">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </div>
                </div>

                {/* Line separator */}
                <Skeleton className="h-[1px] w-full" />

                {/* Video list or description */}
                <div className="space-y-4">
                    {/* Generate 5 items for playlists */}
                    {Array(5).fill(0).map((_, idx) => (
                        <div key={idx} className="flex gap-4">
                            <Skeleton className="w-24 aspect-video rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-1/4" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
