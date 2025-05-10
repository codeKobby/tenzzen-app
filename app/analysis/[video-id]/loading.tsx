import { VideoContentSkeleton } from '@/components/analysis/video-content-skeleton';
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Header - Matching the AnalysisHeader component */}
      <header className="flex items-center justify-between h-16 px-4 border-b bg-background sticky top-0 z-20">
        {/* Back Button */}
        <div className="h-9 w-9">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Title */}
        <div className="flex-1 text-center truncate px-4">
          <h1 className="text-lg font-semibold truncate">
            Video Analysis
          </h1>
        </div>

        {/* Placeholder for right actions */}
        <div className="w-9"></div>
      </header>

      {/* Skeleton Content */}
      <VideoContentSkeleton />
    </div>
  );
}
