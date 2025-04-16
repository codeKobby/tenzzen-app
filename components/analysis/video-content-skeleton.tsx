export function VideoContentSkeleton() {
  return (
    <div className="space-y-4 pb-2 p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-28 h-[63px] bg-secondary rounded-lg" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-4 bg-secondary rounded w-1/2" />
          <div className="flex gap-2 items-center">
            <div className="h-6 w-6 bg-secondary rounded-full" />
            <div className="h-3 bg-secondary rounded w-24" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex gap-4">
          <div className="h-3 bg-secondary rounded w-16" />
          <div className="h-3 bg-secondary rounded w-16" />
          <div className="h-3 bg-secondary rounded w-24" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-secondary rounded w-full" />
          <div className="h-3 bg-secondary rounded w-5/6" />
          <div className="h-3 bg-secondary rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}
