"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Youtube, Bot, Link as LinkIcon, VideoIcon, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CourseGenerationModalProps {
  isOpen: boolean
  onClose: () => void
}

const knowledgeLevels = [
  "Beginner",
  "Intermediate",
  "Advanced"
] as const

type KnowledgeLevel = (typeof knowledgeLevels)[number]
type TabType = "link" | "discover"

interface FormData {
  title: string
  knowledgeLevel: KnowledgeLevel
  preferredChannels: string[]
  additionalContext: string
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
    additionalContext: ""
  })
  const [currentChannel, setCurrentChannel] = React.useState("")

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
          await router.push(`/analysis/${urlInfo.id}`)
          onClose()
        }
      } else {
        if (!formData.title) {
          setIsLoading(false)
          return
        }
        // Process AI generation form - to be implemented
        await new Promise(resolve => setTimeout(resolve, 1000))
        onClose()
      }
    } catch (error) {
      console.error("Failed to process:", error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, youtubeUrl, formData.title, router, onClose, validateYoutubeUrl, parseYoutubeUrl])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[425px] mx-auto h-auto max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background shadow-lg border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl leading-tight">
            Generate New Course
          </DialogTitle>
          <DialogDescription className="text-base">
            Create a custom course from YouTube content or describe what you want to learn.
          </DialogDescription>
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

            <TabsContent value="link" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url" className="text-base">
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
                      className="pl-9 pr-8 text-base"
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
                <p className="text-sm text-muted-foreground">
                  Enter a YouTube video or playlist URL to generate a structured course.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="discover" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">
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
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="text-base">
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
                  <Label htmlFor="channels" className="text-base">
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
                      className="pl-9 text-base"
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
                            onClick={() => removeChannel(channel)}
                            className="ml-2 hover:text-destructive focus:outline-none"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Optionally specify preferred channels for better results
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context" className="text-base">
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
                    className="text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    Any specific preferences or requirements for the course
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex flex-row flex-nowrap gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (activeTab === "link" ? !youtubeUrl : !formData.title)}
            className="flex-1"
          >
            {isLoading ? "Processing..." : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}