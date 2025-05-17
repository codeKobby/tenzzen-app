"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Youtube, Bot, Link as LinkIcon, VideoIcon, X, Loader2, Bookmark } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VideoDiscoveryResults, VideoRecommendation } from "./video-discovery-results"
import { toast } from "sonner"

interface CourseGenerationModalProps {
  isOpen: boolean
  onClose: () => void
}

const knowledgeLevels = [
  "Beginner",
  "Intermediate",
  "Advanced"
] as const

const videoLengths = [
  "Any",
  "Short (< 30 min)",
  "Medium (30 min - 2 hr)",
  "Long (> 2 hr)"
] as const

type KnowledgeLevel = (typeof knowledgeLevels)[number]
type VideoLength = (typeof videoLengths)[number]
type TabType = "link" | "discover"

interface FormData {
  title: string
  knowledgeLevel: KnowledgeLevel
  preferredChannels: string[]
  additionalContext: string
  videoLength: VideoLength
}

interface YouTubeUrlInfo {
  type: 'video' | 'playlist'
  id: string
}

export function CourseGenerationModal({ isOpen, onClose }: CourseGenerationModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<TabType>("link")
  const [youtubeUrl, setYoutubeUrl] = React.useState("")
  const [urlError, setUrlError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({
    title: "",
    knowledgeLevel: "Beginner",
    preferredChannels: [],
    additionalContext: "",
    videoLength: "Any"
  })
  const [currentChannel, setCurrentChannel] = React.useState("")

  // Discovery results state
  const [showDiscoveryResults, setShowDiscoveryResults] = React.useState(false)
  const [discoveryProgress, setDiscoveryProgress] = React.useState(0)
  const [progressMessage, setProgressMessage] = React.useState("Searching for the best courses...")
  const [recommendations, setRecommendations] = React.useState<VideoRecommendation[]>([])
  const [savedVideos, setSavedVideos] = React.useState<VideoRecommendation[]>([])
  const [showSavedVideos, setShowSavedVideos] = React.useState(false)

  const parseYoutubeUrl = React.useCallback((url: string): YouTubeUrlInfo | null => {
    const videoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    const videoMatch = url.match(videoRegex)

    if (videoMatch?.[1]) {
      return { type: 'video', id: videoMatch[1] }
    }

    const playlistRegex = /[?&]list=([^&]+)/i
    const playlistMatch = url.match(playlistRegex)

    if (playlistMatch?.[1]) {
      return { type: 'playlist', id: playlistMatch[1] }
    }

    return null
  }, [])

  const validateYoutubeUrl = React.useCallback((url: string): boolean => {
    if (!url) {
      setUrlError("Please enter a URL")
      return false
    }

    const urlInfo = parseYoutubeUrl(url)
    if (!urlInfo) {
      setUrlError("Please enter a valid YouTube URL")
      return false
    }

    setUrlError(null)
    return true
  }, [parseYoutubeUrl])

  const handleUrlChange = React.useCallback((value: string) => {
    setYoutubeUrl(value)
    if (urlError) validateYoutubeUrl(value)
  }, [urlError, validateYoutubeUrl])

  const handleTabChange = React.useCallback((value: string) => {
    if (value === "link" || value === "discover") {
      setActiveTab(value)
    }
  }, [])

  const handleChannelKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentChannel.trim()) {
      e.preventDefault()
      if (!formData.preferredChannels.includes(currentChannel.trim())) {
        setFormData(prev => ({
          ...prev,
          preferredChannels: [...prev.preferredChannels, currentChannel.trim()]
        }))
      }
      setCurrentChannel("")
    }
  }, [currentChannel, formData.preferredChannels])

  const removeChannel = React.useCallback((channel: string) => {
    setFormData(prev => ({
      ...prev,
      preferredChannels: prev.preferredChannels.filter(c => c !== channel)
    }))
  }, [])

  const handleSubmit = React.useCallback(async () => {
    setIsLoading(true)
    try {
      if (activeTab === "link") {
        if (!validateYoutubeUrl(youtubeUrl)) {
          setIsLoading(false)
          return
        }
        const urlInfo = parseYoutubeUrl(youtubeUrl)
        if (urlInfo) {
          // Show loading state for a moment before navigation
          await new Promise(resolve => setTimeout(resolve, 500))
          // Use a clean URL without any query parameters
          await router.push(`/analysis/${urlInfo.id}`)
          onClose()
        }
      } else {
        if (!formData.title) {
          setIsLoading(false)
          return
        }

        // Process AI discovery form
        setShowDiscoveryResults(true)
        setDiscoveryProgress(10)
        setProgressMessage("Searching for relevant videos...")

        try {
          try {
            // Call the video discovery API without timeout
            const response = await fetch('/api/video-discovery', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: formData.title,
                knowledgeLevel: formData.knowledgeLevel,
                preferredChannels: formData.preferredChannels,
                additionalContext: formData.additionalContext,
                videoLength: formData.videoLength
              })
            });

            setDiscoveryProgress(25)
            setProgressMessage("Finding relevant videos...")

            // Update progress during the potentially long operation
            const progressInterval = setInterval(() => {
              setDiscoveryProgress(prev => {
                // Only increment if we're still in the searching/analyzing phase
                if (prev < 70) {
                  // Increment by small amounts to show activity
                  const increment = Math.random() * 3 + 1; // Random increment between 1-4%
                  return Math.min(70, prev + increment);
                }
                return prev;
              });

              // Cycle through progress messages to show activity
              setProgressMessage(prev => {
                if (prev === "Finding relevant videos...") return "Analyzing video content...";
                if (prev === "Analyzing video content...") return "Evaluating educational value...";
                if (prev === "Evaluating educational value...") return "Matching to your learning goals...";
                return "Finding relevant videos...";
              });
            }, 5000); // Update every 5 seconds

            let data;
            try {
              if (!response.ok) {
                // For 502 Bad Gateway or 504 Gateway Timeout errors
                if (response.status === 502 || response.status === 504) {
                  const errorData = await response.json();

                  // Check if the ADK service is not running
                  if (errorData.serviceStatus) {
                    toast.error(errorData.serviceStatus);
                    console.error("ADK Service Error:", errorData.serviceStatus);
                  }

                  // If we retried the request, let the user know
                  if (errorData.retried) {
                    console.log("Request was retried but still failed");
                  }

                  throw new Error(errorData.error || "The server encountered an error. The ADK service might not be running or is taking longer than expected to respond.");
                } else {
                  throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
              }

              data = await response.json();

              // Check if there's an error message in the response even if status is 200
              if (data.error && !data.recommendations?.length) {
                throw new Error(data.error);
              }

              // If we have recommendations but also an error, show a warning toast
              if (data.error && data.recommendations?.length) {
                if (data.usingMockData) {
                  toast.warning("Using sample recommendations due to timeout. For better results, try a more specific query.");
                } else {
                  toast.warning(data.error);
                }
              }

              // Clear the progress interval
              clearInterval(progressInterval);

              setDiscoveryProgress(85)
              setProgressMessage("Ranking courses by relevance...")

              // Simulate a delay to show the progress
              await new Promise(resolve => setTimeout(resolve, 1000))

              setDiscoveryProgress(100)
              setProgressMessage("Preparing results...")

              // Update recommendations state
              if (data.recommendations && Array.isArray(data.recommendations)) {
                setRecommendations(data.recommendations);
              } else {
                setRecommendations([]);
                toast.error("No matching courses found. Try adjusting your search criteria.");
              }
            } catch (error) {
              // Clear the progress interval if there's an error
              clearInterval(progressInterval);
              throw error;
            }

            // Simulate a delay to show the completed progress
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (fetchError) {
            // Re-throw errors
            throw fetchError;
          }

        } catch (error) {
          console.error("Failed to fetch video recommendations:", error);

          // Provide error messages based on the error
          if (error instanceof Error) {
            toast.error(error.message || "Failed to find courses. Please try again.");
            setProgressMessage("Error occurred. Please try again.");
          } else {
            toast.error("Failed to find courses. Please try again.");
            setProgressMessage("Error occurred. Please try again.");
          }

          // Keep the modal open but show error state
          setDiscoveryProgress(0);
          setIsLoading(false);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to process:", error)
      setIsLoading(false)
    }
  }, [activeTab, youtubeUrl, formData, router, onClose, validateYoutubeUrl, parseYoutubeUrl])

  // Handle selecting a video from the discovery results
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleSelectVideo = React.useCallback((video: VideoRecommendation) => {
    if (!video || !video.videoId) {
      console.error("Invalid video data");
      return;
    }

    try {
      setIsNavigating(true);
      // Navigate to the analysis page for course generation
      router.push(`/analysis/${video.videoId}`);
      setShowDiscoveryResults(false);
      onClose();
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigating(false);
    }
  }, [router, onClose])

  // Handle saving a video for later
  const handleSaveVideo = React.useCallback((video: VideoRecommendation) => {
    // Check if the video is already saved
    const isAlreadySaved = savedVideos.some(saved => saved.videoId === video.videoId)

    if (isAlreadySaved) {
      // Remove the video from saved videos
      setSavedVideos(prev => prev.filter(saved => saved.videoId !== video.videoId))
    } else {
      // Add the video to saved videos
      setSavedVideos(prev => [...prev, video])
    }
  }, [savedVideos])

  // Toggle showing saved videos
  const toggleSavedVideos = React.useCallback(() => {
    setShowSavedVideos(prev => !prev)
  }, [])

  // Utility function to conditionally join class names
  const cn = (...classes: (string | boolean | undefined)[]): string => {
    return classes.filter(Boolean).join(" ")
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[425px] mx-auto h-auto max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background shadow-lg border border-border rounded-lg">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-semibold leading-tight">
                  Generate New Course
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground/90 mt-1.5">
                  Create a custom course from YouTube content or describe what you want to learn.
                </DialogDescription>
              </div>

              {savedVideos.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={toggleSavedVideos}
                  title="View saved courses"
                >
                  <Bookmark className={cn(
                    "h-4 w-4",
                    savedVideos.length > 0 ? "fill-primary text-primary" : ""
                  )} />
                  <span className="hidden sm:inline">{savedVideos.length}</span>
                </Button>
              )}
            </div>
          </DialogHeader>

        <div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">
                <div className="flex items-center gap-2">
                  <VideoIcon className="h-4 w-4" />
                  Direct Link
                </div>
              </TabsTrigger>
              <TabsTrigger value="discover">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI Discovery
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url" className="text-base font-medium">
                  YouTube URL
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <div className="relative">
                    <Input
                      id="youtube-url"
                      placeholder="Paste video or playlist URL"
                      value={youtubeUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="pl-9 pr-8 text-base placeholder:text-muted-foreground/60 placeholder:text-sm"
                    />
                    {youtubeUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setYoutubeUrl("")
                          setUrlError(null)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 inline-flex items-center justify-center rounded-full hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Clear input</span>
                      </button>
                    )}
                  </div>
                </div>
                {urlError && (
                  <p className="text-sm text-destructive">{urlError}</p>
                )}
                <p className="text-sm text-muted-foreground/80 mt-1">
                  Enter a YouTube video or playlist URL to generate a structured course.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="discover" className="mt-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">
                    What do you want to learn? <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Learn Python for Web Development"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    className="text-base placeholder:text-muted-foreground/60 placeholder:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="text-base font-medium">
                    Knowledge Level <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="level"
                    aria-label="Knowledge Level"
                    value={formData.knowledgeLevel}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      knowledgeLevel: e.target.value as KnowledgeLevel
                    }))}
                    className="w-full h-10 px-3 py-2 text-base bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {knowledgeLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channels" className="text-base font-medium">
                    Preferred YouTube Channels
                  </Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="channels"
                      placeholder="Enter channel name and press Enter"
                      value={currentChannel}
                      onChange={(e) => setCurrentChannel(e.target.value)}
                      onKeyDown={handleChannelKeyDown}
                      className="pl-9 text-base placeholder:text-muted-foreground/60 placeholder:text-sm"
                    />
                  </div>
                  {formData.preferredChannels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.preferredChannels.map(channel => (
                        <Badge
                          key={channel}
                          variant="secondary"
                          className="py-1 px-2"
                        >
                          {channel}
                          <button
                            type="button"
                            onClick={() => removeChannel(channel)}
                            className="ml-2 hover:text-destructive focus:outline-none"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground/80 mt-1">
                    Optionally specify preferred channels for better results
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context" className="text-base font-medium">
                    Additional Context
                  </Label>
                  <Input
                    id="context"
                    placeholder="e.g., Focus on practical examples, project-based learning"
                    value={formData.additionalContext}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalContext: e.target.value
                    }))}
                    className="text-base placeholder:text-muted-foreground/60 placeholder:text-sm"
                  />
                  <p className="text-sm text-muted-foreground/80 mt-1">
                    Any specific preferences or requirements for the course
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoLength" className="text-base font-medium">
                    Preferred Video Length
                  </Label>
                  <select
                    id="videoLength"
                    aria-label="Preferred Video Length"
                    value={formData.videoLength}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      videoLength: e.target.value as VideoLength
                    }))}
                    className="w-full h-10 px-3 py-2 text-base bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {videoLengths.map(length => (
                      <option key={length} value={length}>{length}</option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground/80 mt-1">
                    Choose your preferred video duration
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex flex-row flex-nowrap gap-3 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (activeTab === "link" ? !youtubeUrl : !formData.title)}
            className={cn(
              "flex-1",
              (isLoading || (activeTab === "link" ? !youtubeUrl : !formData.title)) &&
              "cursor-not-allowed opacity-60"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              "Next"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Video Discovery Results Modal */}
    <VideoDiscoveryResults
      isOpen={showDiscoveryResults}
      onClose={() => setShowDiscoveryResults(false)}
      isLoading={isLoading}
      progress={discoveryProgress}
      progressMessage={progressMessage}
      recommendations={recommendations}
      onSelectVideo={handleSelectVideo}
      onSaveVideo={handleSaveVideo}
    />

    {/* Saved Videos Modal */}
    {showSavedVideos && savedVideos.length > 0 && (
      <VideoDiscoveryResults
        isOpen={showSavedVideos}
        onClose={() => setShowSavedVideos(false)}
        isLoading={false}
        progress={100}
        progressMessage=""
        recommendations={savedVideos}
        onSelectVideo={handleSelectVideo}
        onSaveVideo={handleSaveVideo}
      />
    )}
  </>)
}