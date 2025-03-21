import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Content Area Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}