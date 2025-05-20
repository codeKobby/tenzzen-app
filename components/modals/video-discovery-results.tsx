"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bookmark, Check, ChevronDown, ChevronUp, ExternalLink, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export interface VideoRecommendation {
  videoId: string
  title: string
  channelName?: string
  channelAvatar?: string
  thumbnail?: string
  duration?: string
  views?: string
  publishDate?: string
  relevanceScore: number
  benefit?: string
  relevanceJustification?: string
  description?: string
  keyConcepts?: string[]
  benefits?: string[]
  alignmentExplanation?: string
  qualityIndicators?: string[]
}

interface VideoDiscoveryResultsProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  progress: number
  progressMessage: string
  recommendations: VideoRecommendation[]
  onSelectVideo: (video: VideoRecommendation) => void
  onSaveVideo: (video: VideoRecommendation) => void
}

export function VideoDiscoveryResults({
  isOpen,
  onClose,
  isLoading,
  progress,
  progressMessage,
  recommendations,
  onSelectVideo,
  onSaveVideo
}: VideoDiscoveryResultsProps) {
  const [expandedVideoIds, setExpandedVideoIds] = React.useState<Set<string>>(new Set())
  const [savedVideos, setSavedVideos] = React.useState<Set<string>>(new Set())

  const toggleVideoExpand = React.useCallback((videoId: string): void => {
    setExpandedVideoIds(prev => {
      const newSet = new Set(prev)
      if (prev.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }, [])

  const handleSaveVideo = React.useCallback((video: VideoRecommendation, e: React.MouseEvent) => {
    e.stopPropagation()

    // Update saved videos state
    setSavedVideos(prev => {
      const newSet = new Set(prev)
      if (prev.has(video.videoId)) {
        newSet.delete(video.videoId)
        toast.info("Video removed from saved courses")
      } else {
        newSet.add(video.videoId)
        toast.success("Video saved to your courses")
      }
      return newSet
    })

    // Call the parent handler
    onSaveVideo(video)
  }, [onSaveVideo])

  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleSelectVideo = React.useCallback((video: VideoRecommendation) => {
    if (!video || !video.videoId) {
      console.error("Invalid video data");
      return;
    }

    try {
      setIsNavigating(true);
      // Call the parent handler which should navigate to the analysis page
      onSelectVideo(video);
      onClose();
    } catch (error) {
      console.error("Error selecting video:", error);
      setIsNavigating(false);
    }
  }, [onSelectVideo, onClose])

  const formatRelevanceScore = (score: number): string => {
    return score.toFixed(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-md mx-auto h-auto max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background shadow-lg border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Finding Courses" : "Recommended Courses"}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-full max-w-md">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-xl font-semibold">Finding the best courses for you</h2>
                <p className={cn(
                  "text-muted-foreground",
                  progressMessage.includes("Error") || progressMessage.includes("timeout") ? "text-destructive" : ""
                )}>
                  {progressMessage}
                </p>
              </div>

              {progress > 0 ? (
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full bg-primary transition-all duration-300 ease-in-out",
                      progress <= 10 ? "w-[10%]" :
                      progress <= 20 ? "w-[20%]" :
                      progress <= 30 ? "w-[30%]" :
                      progress <= 40 ? "w-[40%]" :
                      progress <= 50 ? "w-[50%]" :
                      progress <= 60 ? "w-[60%]" :
                      progress <= 70 ? "w-[70%]" :
                      progress <= 80 ? "w-[80%]" :
                      progress <= 90 ? "w-[90%]" :
                      "w-full"
                    )}
                  />
                </div>
              ) : progressMessage.includes("Error") || progressMessage.includes("timeout") ? (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="mx-auto"
                  >
                    Try Again Later
                  </Button>
                </div>
              ) : (
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary/30 animate-pulse w-full" />
                </div>
              )}
            </div>

            <div className="w-full max-w-md space-y-4">
              <DiscoveryLoadingSkeleton />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                We've analyzed and ranked these videos based on your learning goals
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No matching courses found. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((video, index) => (
                  <div
                    key={video.videoId}
                    className={cn(
                      "group border rounded-lg overflow-hidden hover:border-primary/50 transition-all",
                      expandedVideoIds.has(video.videoId) ? "bg-secondary/30" : ""
                    )}
                  >
                    <div
                      className="flex gap-4 p-4 cursor-pointer"
                      onClick={() => toggleVideoExpand(video.videoId)}
                    >
                      <div className="flex-shrink-0 relative">
                        <div className="w-32 aspect-video rounded-md overflow-hidden bg-secondary">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // If image fails to load, replace with default thumbnail based on video ID
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite loop
                                target.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
                              }}
                            />
                          ) : (
                            <img
                              src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // If even the default thumbnail fails, show the icon
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.style.display = 'none';
                                // Add the icon as a sibling
                                const parent = target.parentElement;
                                if (parent) {
                                  const iconDiv = document.createElement('div');
                                  iconDiv.className = 'w-full h-full flex items-center justify-center bg-secondary';
                                  iconDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-muted-foreground/40"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>';
                                  parent.appendChild(iconDiv);
                                }
                              }}
                            />
                          )}
                          {video.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                              {video.duration}
                            </div>
                          )}
                        </div>
                        <Badge
                          className="absolute -top-2 -left-2 flex items-center gap-1"
                          variant="secondary"
                        >
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span>{formatRelevanceScore(video.relevanceScore)}</span>
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-base line-clamp-2">{video.title}</h3>
                          <div className="flex items-start gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={(e) => handleSaveVideo(video, e)}
                              title={savedVideos.has(video.videoId) ? "Remove from saved" : "Save for later"}
                            >
                              <Bookmark
                                className={cn(
                                  "h-5 w-5",
                                  savedVideos.has(video.videoId) ? "fill-primary text-primary" : ""
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() => toggleVideoExpand(video.videoId)}
                            >
                              {expandedVideoIds.has(video.videoId) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span className="font-medium">
                            {video.channelName || (video.videoId ? "YouTube Channel" : "Unknown channel")}
                          </span>
                          {video.views && (
                            <>
                              <span>•</span>
                              <span>{video.views} views</span>
                            </>
                          )}
                          {video.publishDate && (
                            <>
                              <span>•</span>
                              <span>{video.publishDate}</span>
                            </>
                          )}
                          {!video.views && !video.publishDate && video.videoId && (
                            <>
                              <span>•</span>
                              <span>YouTube video</span>
                            </>
                          )}
                        </div>

                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs font-normal">
                            {index === 0 ? "Best match" : `Recommended #${index + 1}`}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {expandedVideoIds.has(video.videoId) && (
                      <div className="px-4 pb-4 pt-1 border-t">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Learning Benefits:</h4>
                            <p className="text-sm text-muted-foreground">
                              {video.benefit ||
                               (video.relevanceJustification ? video.relevanceJustification :
                                `Learn about ${video.title || 'this topic'} with a comprehensive tutorial`)}
                            </p>
                          </div>

                          {video.description && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Description:</h4>
                              <p className="text-sm text-muted-foreground line-clamp-3">{video.description}</p>
                            </div>
                          )}

                          <div className="flex justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open on YouTube
                            </Button>

                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleSelectVideo(video)}
                              disabled={isNavigating}
                            >
                              <Check className="h-4 w-4" />
                              {isNavigating ? "Navigating..." : "Select This Course"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function VideoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
}

function DiscoveryLoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 border rounded-lg p-4">
          <div className="flex-shrink-0">
            <Skeleton className="w-32 h-[72px] rounded-md relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
            </Skeleton>
          </div>

          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
            </Skeleton>

            <Skeleton className="h-4 w-1/2 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
            </Skeleton>

            <Skeleton className="h-3 w-24 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"></div>
            </Skeleton>
          </div>
        </div>
      ))}
    </>
  )
}
