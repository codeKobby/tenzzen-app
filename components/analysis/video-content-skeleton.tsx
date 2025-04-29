export function VideoContentSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left panel - Video Content skeleton */}
      <div className="hidden sm:block relative border-r bg-background w-[400px]">
        <div className="h-full overflow-auto">
          <div className="space-y-4 pb-2 p-4">
            {/* Video title and thumbnail section */}
            <div className="space-y-4">
              <div className="flex gap-4">
                {/* Thumbnail skeleton */}
                <div className="flex-shrink-0">
                  <div className="w-28 h-[63px] bg-secondary rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                  </div>
                </div>

                {/* Video details skeleton */}
                <div className="flex-1 space-y-2">
                  {/* Title lines */}
                  <div className="h-4 bg-secondary rounded w-3/4 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                  </div>
                  <div className="h-4 bg-secondary rounded w-1/2 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                  </div>

                  {/* Channel info skeleton */}
                  <div className="flex gap-2 items-center">
                    <div className="h-6 w-6 bg-secondary rounded-full relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                    </div>
                    <div className="h-3 bg-secondary rounded w-24 relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video stats and description */}
            <div className="space-y-2">
              {/* Stats row */}
              <div className="flex gap-4">
                <div className="h-3 bg-secondary rounded w-16 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                </div>
                <div className="h-3 bg-secondary rounded w-16 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                </div>
                <div className="h-3 bg-secondary rounded w-24 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                </div>
              </div>

              {/* Description lines */}
              <div className="space-y-1 mt-2">
                <div className="h-3 bg-secondary rounded w-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                </div>
                <div className="h-3 bg-secondary rounded w-5/6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                </div>
                <div className="h-3 bg-secondary rounded w-4/6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile version (single panel) - Only shown on mobile */}
      <div className="sm:hidden w-full p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            {/* Thumbnail skeleton */}
            <div className="flex-shrink-0">
              <div className="w-24 h-[54px] bg-secondary rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-3/4 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
              </div>
              <div className="h-4 bg-secondary rounded w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Course generation button */}
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 h-5 bg-secondary rounded w-64 mx-auto relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
        </div>
        <div className="h-10 w-48 bg-secondary rounded-md mx-auto relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
