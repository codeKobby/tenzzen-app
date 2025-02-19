"use client"

import { useState, useRef, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  PictureInPicture,
  Volume2,
  VolumeX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Timestamp {
  time: number
  label: string
  description?: string
}

interface VideoPlayerProps {
  videoId: string
  title: string
  timestamps?: Timestamp[]
  onProgressUpdate?: (progress: number) => void
  initialProgress?: number
}

export function VideoPlayer({
  videoId,
  title,
  timestamps = [],
  onProgressUpdate,
  initialProgress = 0,
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = initialProgress * duration
    }
  }, [initialProgress, duration])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgressUpdate?.(video.currentTime / video.duration)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [onProgressUpdate])

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setPlaying(!playing)
    }
  }

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const skip = (amount: number) => {
    if (videoRef.current) {
      const newTime = currentTime + amount
      seek(Math.max(0, Math.min(newTime, duration)))
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } catch (error) {
        console.error("Error requesting fullscreen:", error)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (error) {
        console.error("Error exiting fullscreen:", error)
      }
    }
  }

  const togglePiP = async () => {
    if (!videoRef.current) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else {
        await videoRef.current.requestPictureInPicture()
        setIsPiP(true)
      }
    } catch (error) {
      console.error("Error toggling picture-in-picture:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false)
      }
    }, 3000)
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative group bg-black rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => playing && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full aspect-video"
        />

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
            !showControls && "opacity-0 pointer-events-none"
          )}
        >
          <div className="space-y-4">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={([value]) => seek(value)}
              className="cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {playing ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/20"
                  onClick={() => skip(-10)}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/20"
                  onClick={() => skip(10)}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/20"
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>

                <span className="text-sm text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/20"
                  onClick={togglePiP}
                >
                  <PictureInPicture className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {timestamps.length > 0 && (
        <div className="border rounded-lg">
          <h3 className="font-medium px-4 py-2 border-b">Timestamps</h3>
          <ScrollArea className="h-[200px]">
            <div className="p-4 space-y-2">
              {timestamps.map((timestamp, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors"
                  onClick={() => seek(timestamp.time)}
                >
                  <Badge variant="outline">{formatTime(timestamp.time)}</Badge>
                  <div>
                    <h4 className="font-medium">{timestamp.label}</h4>
                    {timestamp.description && (
                      <p className="text-sm text-muted-foreground">
                        {timestamp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
