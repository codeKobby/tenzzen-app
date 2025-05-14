import { Skeleton } from "@/components/ui/skeleton"

export default function LearningAreaLoading() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header Skeleton */}
      <div className="h-16 border-b bg-background flex items-center px-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-48 ml-4" />
        <div className="ml-auto flex items-center gap-4">
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r hidden md:block">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-8 w-full mt-6" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="flex-1 p-4 flex flex-col">
          <Skeleton className="aspect-video w-full max-w-4xl mx-auto mb-6" />
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
