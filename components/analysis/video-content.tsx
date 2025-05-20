"use client";

import { useState, useCallback, useMemo } from "react";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertCircle, MinusCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { getYoutubeData } from "@/actions/getYoutubeData"; // Changed from getVideoDetails
import type { VideoDetails, PlaylistDetails, PlaylistVideo, ContentDetails } from "@/types/youtube";
import { startUrl } from "@/lib/utils";
import { VideoContentSkeleton } from "@/components/analysis/video-content-skeleton";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { YouTubeThumbnail } from "@/components/youtube-thumbnail";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const isPlaylist = (content: ContentDetails): content is PlaylistDetails => {
  return content.type === "playlist";
};

interface VideoContentProps {
  loading?: boolean;
  error?: string | null;
  videoData: ContentDetails | null; // Added videoData prop
}

const isValidContentDetails = (data: any): data is ContentDetails => {
  if (!data || typeof data !== 'object') return false;
  return (
    'type' in data &&
    'id' in data &&
    (data.type === 'video' || data.type === 'playlist')
  );
};

const createVideoKey = (video: VideoDetails | PlaylistVideo, index: number): string => {
  return `${video.id}-${index}`;
};

const openInNewTab = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export function VideoContent({ loading, error }: VideoContentProps) {
  const { videoData, setVideoData } = useAnalysis();
  const [expandedVideoIds, setExpandedVideoIds] = useState<Set<string>>(new Set());
  const [showVideoOpenDialog, setShowVideoOpenDialog] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [dontShowVideoDialog, setDontShowVideoDialog] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dontShowVideoDialog') === 'true';
    }
    return false;
  });
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [removedVideos, setRemovedVideos] = useState<Record<string, PlaylistVideo>>({});
  const [activeCancelId, setActiveCancelId] = useState<string | null>(null);

  const activeVideoCount = useMemo(() => {
    if (videoData && isPlaylist(videoData)) {
      return videoData.videos.filter((video) => !removedVideos[video.id]).length;
    }
    return 0;
  }, [videoData, removedVideos]);

  const updateVideoData = useCallback((data: unknown) => {
    if (!data) {
      setVideoData(null);
      return;
    }
    if (isValidContentDetails(data)) {
      setVideoData(data);
    } else {
      console.error('Invalid content type:', data);
      setVideoData(null);
    }
  }, [setVideoData]);

  const handleVideoClick = useCallback(async (videoId: string): Promise<void> => {
    if (videoData && isPlaylist(videoData)) {
      try {
        const details = await getYoutubeData(videoId); // Changed from getVideoDetails
        if (!details) {
          console.error('No video details returned');
          return;
        }
        if (isValidContentDetails(details) && details.type === 'video') {
          updateVideoData(details);
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
        const playlistVideo = videoData.videos.find((v) => v.id === videoId);
        if (playlistVideo) {
          updateVideoData(playlistVideo);
        }
      }
      return;
    }

    const url = `https://youtube.com/watch?v=${videoId}`;
    if (dontShowVideoDialog) {
      openInNewTab(url);
    } else {
      setSelectedVideoUrl(url);
      setShowVideoOpenDialog(true);
    }
  }, [videoData, updateVideoData, dontShowVideoDialog]);

  const handlePlaylistClick = useCallback((playlistId: string): void => {
    const url = `https://youtube.com/playlist?list=${playlistId}`;
    if (dontShowVideoDialog) {
      openInNewTab(url);
    } else {
      setSelectedVideoUrl(url);
      setShowVideoOpenDialog(true);
    }
  }, [dontShowVideoDialog]);

  const toggleVideoExpand = useCallback((videoId: string): void => {
    setExpandedVideoIds(prev => {
      const newSet = new Set(prev);
      if (prev.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);

  const toggleDescription = useCallback((): void => {
    setShowFullDescription(prev => !prev);
  }, []);

  const handleRemoveVideo = useCallback((video: PlaylistVideo, event: React.MouseEvent) => {
    event.stopPropagation();

    // Update state immediately
    setRemovedVideos(prev => ({ ...prev, [video.id]: video }));
    setActiveCancelId(video.id); // Set active cancel ID for visual feedback

    const toastId = `remove-${video.id}`;

    // Show the toast with an Undo button
    toast.custom((id: string | number) => (
      <div className={cn(
        "flex flex-col gap-2 rounded-lg border bg-background p-4 shadow-lg",
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Video removed from list</div>
            <div className="text-xs text-muted-foreground">
              This video has been removed from your playlist
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Undo logic: Remove from removedVideos and clear activeCancelId
              setRemovedVideos(prev => {
                const newRemoved = { ...prev };
                delete newRemoved[video.id];
                return newRemoved;
              });
              setActiveCancelId(null);
              toast.dismiss(id); // Dismiss this specific toast
            }}
            className="border border-border px-2 h-8 hover:bg-accent hover:text-accent-foreground"
          >
            Undo
          </Button>
        </div>
        {/* Progress bar for auto-dismiss visualization */}
        <div className="w-full h-[3px] bg-muted rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-primary animate-countdown-progress"
          // Add a utility class if needed or configure animation duration in CSS/Tailwind
          />
        </div>
      </div>
    ), {
      id: toastId,
      duration: 5000, // Auto-dismiss after 5 seconds
      // onDismiss and onAutoClose are called when the toast is removed
      onDismiss: () => {
        // Ensure activeCancelId is cleared if the toast is dismissed (not via Undo)
        setActiveCancelId(currentId => (currentId === video.id ? null : currentId));
      },
      onAutoClose: () => {
        // Ensure activeCancelId is cleared if the toast auto-closes
        setActiveCancelId(currentId => (currentId === video.id ? null : currentId));
      }
    });
  }, [setRemovedVideos, setActiveCancelId]); // Dependencies for useCallback

  if (loading) {
    return <VideoContentSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-2" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Content</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">No content selected</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pb-2 p-4">
        {!isPlaylist(videoData) ? (
          // Single Video Display
          <div className="space-y-4">
            {/* ... (rest of single video display code remains the same) ... */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-28 relative cursor-pointer rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                  onClick={() => handleVideoClick(videoData.id)}
                >
                  {videoData.id ? (
                    <YouTubeThumbnail
                      videoId={videoData.id}
                      alt={videoData.title}
                      className="w-full aspect-video"
                    />
                  ) : (
                    <PlaceholderImage
                      src={videoData.thumbnail}
                      alt={videoData.title}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {videoData.duration}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2 break-words">
                  {videoData.title}
                </h2>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                      {videoData.channelAvatar ? (
                        <PlaceholderImage
                          src={videoData.channelAvatar}
                          alt={videoData.channelName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {(videoData.channelName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/80 truncate">
                      {videoData.channelName}
                    </span>
                  </div>
                  <Button
                    onClick={toggleDescription}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent flex items-center gap-1 z-10"
                  >
                    {showFullDescription ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Show more
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {showFullDescription && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/70 pb-3 border-b">
                  <span>{videoData.views} views</span>
                  <span>{videoData.likes} likes</span>
                  <span>{videoData.publishDate}</span>
                </div>
                <div className="text-xs leading-relaxed text-muted-foreground/80 whitespace-pre-wrap break-words overflow-x-hidden">
                  {videoData.description}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Playlist Display
          <div className="space-y-4">
            <div className="sticky top-0 z-50 bg-background pt-2 pb-3 -mt-2 -mx-4 px-4 border-b border-border/40">
              {/* ... (rest of playlist header code remains the same) ... */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className="w-24 relative cursor-pointer rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                    onClick={() => handlePlaylistClick(videoData.id)}
                  >
                    {videoData.id ? (
                      <YouTubeThumbnail
                        videoId={videoData.id}
                        alt={videoData.title}
                        className="w-full aspect-video"
                      />
                    ) : (
                      <PlaceholderImage
                        src={videoData.thumbnail}
                        alt={videoData.title}
                        className="w-full aspect-video object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
                    {videoData.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground/90">
                      {videoData.channelName}
                    </span>
                    <span className="text-xs text-muted-foreground/60">•</span>
                    <span className="text-xs text-muted-foreground/80">
                      {activeVideoCount} video{activeVideoCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2 relative z-0">
              {videoData.videos
                .filter(video => !removedVideos[video.id])
                .map((video, index) => (
                  <div key={createVideoKey(video, index)} className="group -mx-4 px-4">
                    <div className={`hover:bg-secondary/50 rounded-lg ${expandedVideoIds.has(video.id) ? "bg-secondary/30" : ""}`}>
                      <div className="flex gap-3 p-2">
                        <div className="flex-shrink-0 self-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10
                                     opacity-70 sm:opacity-40 sm:group-hover:opacity-100 transition-all rounded-full border border-transparent
                                     hover:border-destructive/30"
                            onClick={(e) => handleRemoveVideo(video, e)}
                            title="Remove from list"
                            aria-label="Remove video"
                          >
                            <MinusCircle className="h-[15px] w-[15px]" />
                            <span className="sr-only">Remove from list</span>
                          </Button>
                        </div>

                        <span className="text-xs text-center text-muted-foreground/60 pt-1.5 hidden sm:block">
                          {index + 1}
                        </span>

                        <div className="flex-shrink-0">
                          <div
                            className="w-24 relative cursor-pointer rounded overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                            onClick={() => handleVideoClick(video.id)}
                          >
                            {video.id ? (
                              <YouTubeThumbnail
                                videoId={video.id}
                                alt={video.title}
                                className="w-full aspect-video"
                              />
                            ) : (
                              <PlaceholderImage
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full aspect-video object-cover"
                              />
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                              {video.duration}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h4 className="font-medium text-sm leading-snug text-foreground line-clamp-2">
                            {video.title}
                          </h4>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-6 w-6 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                                {video.channelAvatar ? (
                                  <PlaceholderImage
                                    src={video.channelAvatar}
                                    alt={video.channelName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    {(video.channelName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground/80 truncate">
                                {video.channelName}
                              </span>
                            </div>
                            <Button
                              onClick={() => toggleVideoExpand(video.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent flex items-center gap-1 z-10"
                            >
                              {expandedVideoIds.has(video.id) ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" />
                                  Show more
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Conditional rendering of progress bar based on activeCancelId */}
                          {activeCancelId === video.id && (
                            <div className="w-full mt-1 bg-muted h-[3px] rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full animate-countdown-progress"
                                // Add a utility class if needed or configure animation duration in CSS/Tailwind
                                onAnimationEnd={() => setActiveCancelId(null)} // Use callback
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {expandedVideoIds.has(video.id) && (
                        <div className="relative">
                          {/* ... (rest of expanded video details code remains the same) ... */}
                          <div className="absolute inset-0 bg-background/95 backdrop-blur-[2px]" />
                          <div className="relative z-10 px-2 pb-4 mt-2">
                            <div className="mt-1 space-y-4">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/70 pb-3 border-b">
                                <span>{video.views} views</span>
                                <span>{video.likes} likes</span>
                                <span>{video.publishDate}</span>
                              </div>
                              <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap break-words overflow-x-hidden">
                                {video.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showVideoOpenDialog} onOpenChange={setShowVideoOpenDialog}>
        {/* ... (rest of AlertDialog code remains the same) ... */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open Video in New Tab?</AlertDialogTitle>
            <AlertDialogDescription>
              This will open the video in a new browser tab on YouTube.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dontShowAgain"
                className="rounded border-input h-4 w-4"
                checked={dontShowVideoDialog}
                onChange={(e) => {
                  setDontShowVideoDialog(e.target.checked);
                  localStorage.setItem('dontShowVideoDialog', e.target.checked.toString());
                }}
              />
              <label htmlFor="dontShowAgain" className="text-sm text-muted-foreground">
                Don't show this message again
              </label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowVideoOpenDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (selectedVideoUrl) {
                  openInNewTab(selectedVideoUrl);
                }
                setShowVideoOpenDialog(false);
              }}>
                Open Video
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
