'use client'

interface YoutubePreviewProps {
  videoId?: string;
  className?: string;
}

export function YoutubePreview({ videoId = 'demo-video-id', className = '' }: YoutubePreviewProps) {
  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden bg-muted ${className}`}>
      {videoId ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Demo Video Placeholder</div>
        </div>
      )}
    </div>
  );
}
