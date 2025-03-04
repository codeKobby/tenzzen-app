"use client"

import { useState } from "react"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown, ChevronUp, ExternalLink, AlertCircle } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { VideoDetails, PlaylistDetails, VideoItem } from "@/types/youtube"
import { startUrl } from "@/lib/utils"

type ContentDetails = VideoDetails | PlaylistDetails

const isPlaylist = (content: ContentDetails): content is PlaylistDetails => {
  return content.type === "playlist"
}

interface VideoContentProps {
  loading?: boolean
  error?: string | null
}

export function VideoContent({ loading, error }: VideoContentProps) {
  const { videoData } = useAnalysis()
  const [expandedVideoIds, setExpandedVideoIds] = useState<Set<string>>(new Set())
  const [showVideoOpenDialog, setShowVideoOpenDialog] = useState(false)
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
  const [dontShowVideoDialog, setDontShowVideoDialog] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dontShowVideoDialog') === 'true'
    }
    return false
  })
  const [showFullDescription, setShowFullDescription] = useState(false)

  const handleVideoClick = (videoId: string): void => {
    const url = `https://youtube.com/watch?v=${videoId}`
    if (dontShowVideoDialog) {
      startUrl(url, '_blank', 'noopener,noreferrer')
    } else {
      setSelectedVideoUrl(url)
      setShowVideoOpenDialog(true)
    }
  }

  const handlePlaylistClick = (playlistId: string): void => {
    const url = `https://youtube.com/playlist?list=${playlistId}`
    if (dontShowVideoDialog) {
      startUrl(url, '_blank', 'noopener,noreferrer')
    } else {
      setSelectedVideoUrl(url)
      setShowVideoOpenDialog(true)
    }
  }

  const toggleVideoExpand = (videoId: string): void => {
    setExpandedVideoIds((prev) => {
      const newSet = new Set(prev)
      if (prev.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }

  const toggleDescription = (): void => {
    setShowFullDescription((prev) => !prev)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading content details...</p>
      </div>
    )
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
    )
  }

  if (!videoData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">No content selected</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 pb-2 p-4">
        {!isPlaylist(videoData) ? (
          // Single Video Display
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-28 relative cursor-pointer rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                  onClick={() => handleVideoClick(videoData.id)}
                >
                  <img
                    src={videoData.thumbnail}
                    alt={videoData.title}
                    className="w-full aspect-video object-cover"
                  />
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
                        <img
                          src={videoData.channelAvatar}
                          alt={videoData.channelName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {videoData.channelName.charAt(0).toUpperCase()}
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
                    className="h-7 px-2 text-xs text-muted-foreground/70 hover:text-muted-foreground flex items-center gap-1 z-10"
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
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-24 relative cursor-pointer rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                  onClick={() => handlePlaylistClick(videoData.id)}
                >
                  <img
                    src={videoData.thumbnail}
                    alt={videoData.title}
                    className="w-full aspect-video object-cover"
                  />
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
                    {videoData.videoCount} videos
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="space-y-4">
              {videoData.videos.map((video: VideoItem, index: number) => (
                <div key={video.id} className="group">
                  <div className="flex gap-4 hover:bg-secondary/50 rounded-lg p-2 -mx-2">
                    <span className="text-xs text-center text-muted-foreground/60 pt-1.5 hidden sm:block">
                      {index + 1}
                    </span>
                    <div className="flex-shrink-0">
                      <div
                        className="w-24 relative cursor-pointer rounded overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                        onClick={() => handleVideoClick(video.id)}
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className="font-medium text-sm leading-snug text-foreground line-clamp-2">
                        {video.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground/80 truncate">
                          {video.channelName}
                        </span>
                        <Button
                          onClick={() => toggleVideoExpand(video.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-all duration-200 flex items-center gap-1 z-10"
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

                      {expandedVideoIds.has(video.id) && (
                        <div className="mt-2">
                          <div className="p-2 rounded-lg bg-secondary/30">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70 pb-2 mb-2 border-b border-border/50">
                              <span>{video.views} views</span>
                              <span>•</span>
                              <span>{video.publishDate}</span>
                            </div>
                            <div className="text-xs leading-relaxed text-muted-foreground/80 whitespace-pre-line">
                              {video.description}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showVideoOpenDialog} onOpenChange={setShowVideoOpenDialog}>
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
                  setDontShowVideoDialog(e.target.checked)
                  localStorage.setItem('dontShowVideoDialog', e.target.checked.toString())
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
                  startUrl(selectedVideoUrl, '_blank', 'noopener,noreferrer')
                }
                setShowVideoOpenDialog(false)
              }}>
                Open Video
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
