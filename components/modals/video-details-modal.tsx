"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { getVideoDetails, getPlaylistDetails, VideoDetails, PlaylistDetails, VideoItem } from "@/app/actions/youtube"

interface VideoDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    onGenerate: () => void
    videoUrl: string
}

type ContentDetails = VideoDetails | PlaylistDetails

const isPlaylist = (content: ContentDetails): content is PlaylistDetails => {
    return content.type === "playlist"
}

export function VideoDetailsModal({
    isOpen,
    onClose,
    onGenerate,
    videoUrl
}: VideoDetailsModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null)
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
    const [expandedVideoIds, setExpandedVideoIds] = useState<Set<string>>(new Set())
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [showVideoOpenDialog, setShowVideoOpenDialog] = useState(false)
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
    const [dontShowVideoDialog, setDontShowVideoDialog] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dontShowVideoDialog') === 'true'
        }
        return false
    })
    const [showFullDescription, setShowFullDescription] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleVideoClick = (videoId: string): void => {
        const url = `https://youtube.com/watch?v=${videoId}`
        if (dontShowVideoDialog) {
            window.open(url, '_blank')
        } else {
            setSelectedVideoUrl(url)
            setShowVideoOpenDialog(true)
        }
    }

    const parseYoutubeUrl = (url: string): { type: 'video' | 'playlist', id: string } | null => {
        const videoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
        const videoMatch = url.match(videoRegex)

        if (videoMatch && videoMatch[1]) {
            return { type: 'video', id: videoMatch[1] }
        }

        const playlistRegex = /[?&]list=([^&]+)/i
        const playlistMatch = url.match(playlistRegex)

        if (playlistMatch && playlistMatch[1]) {
            return { type: 'playlist', id: playlistMatch[1] }
        }

        return null
    }

    useEffect(() => {
        const fetchContentDetails = async (urlInfo: { type: 'video' | 'playlist', id: string }): Promise<void> => {
            try {
                if (urlInfo.type === 'video') {
                    const videoData = await getVideoDetails(urlInfo.id)
                    setContentDetails(videoData)
                    setActiveVideoId(urlInfo.id)
                } else {
                    const playlistData = await getPlaylistDetails(urlInfo.id)
                    setContentDetails(playlistData)
                    if (playlistData.videos.length > 0) {
                        setActiveVideoId(playlistData.videos[0].id)
                    }
                }
            } catch (error) {
                console.error("Error fetching content details:", error)
                setError("Failed to fetch content details. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        if (isOpen && videoUrl) {
            setLoading(true)
            setError(null)
            const urlInfo = parseYoutubeUrl(videoUrl)

            if (!urlInfo) {
                setLoading(false)
                setError("Invalid YouTube URL. Please provide a valid video or playlist URL.")
                return
            }

            fetchContentDetails(urlInfo)
        }
    }, [isOpen, videoUrl])

    const handleGenerate = async (): Promise<void> => {
        setGenerating(true)
        try {
            // Assuming we're dealing with a video type
            if (activeVideoId) {
                router.push(`/analysis/${activeVideoId}`)
            }
        } catch (error: any) {
            console.error("Error generating course:", error)
        } finally {
            setGenerating(false)
            onGenerate()
        }
    }

    const toggleVideoExpand = (videoId: string): void => {
        setExpandedVideoIds((prev: Set<string>) => {
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
        setShowFullDescription((prev: boolean) => !prev)
    }

    return (
        <>
            <Dialog open={isOpen && !showVideoOpenDialog} onOpenChange={(open: boolean) => !open && setShowCancelDialog(true)}>
                <DialogContent className="max-w-[425px] w-full h-[85vh] p-0">
                    {/* Fixed structure with three distinct sections: header, body, footer */}
                    <div className="flex flex-col h-full ">
                        {/* HEADER - Fixed at top */}
                        {contentDetails?.type !== "playlist" && (
                            <div className="p-6 pb-3 border-b sticky top-0 bg-background z-10">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold tracking-tight">
                                        {loading ? "Loading Content..." : "Video Details"}
                                    </DialogTitle>
                                </DialogHeader>
                            </div>
                        )}

                        {/* BODY - Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6 pt-4 pb-24 scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex-grow-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="mt-4 text-muted-foreground">Loading content details...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <p className="text-destructive">{error}</p>
                                </div>
                            ) : contentDetails ? (
                                <div className="space-y-4">
                                    {contentDetails.type === "video" ? (
                                        // Single Video Display
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0">
                                                    <div
                                                        className="w-28 relative cursor-pointer rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                                                        onClick={() => handleVideoClick(contentDetails.id)}
                                                    >
                                                        <img
                                                            src={contentDetails.thumbnail}
                                                            alt={contentDetails.title}
                                                            className="w-full aspect-video object-cover"
                                                        />
                                                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                                            {contentDetails.duration}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2 break-words">
                                                        {contentDetails.title}
                                                    </h2>
                                                    <div className="flex items-center justify-between gap-2 mt-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="h-6 w-6 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                                                                {contentDetails.channelAvatar ? (
                                                                    <img
                                                                        src={contentDetails.channelAvatar}
                                                                        alt={contentDetails.channelName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                        {contentDetails.channelName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground/80 truncate">
                                                                {contentDetails.channelName}
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

                                            {/* Video details section with improved visibility control */}
                                            {showFullDescription && (
                                                <div className="space-y-4">
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/70 pb-3 border-b">
                                                        <span>{contentDetails.views} views</span>
                                                        <span>{contentDetails.likes} likes</span>
                                                        <span>{contentDetails.publishDate}</span>
                                                    </div>
                                                    <div className="text-xs leading-relaxed text-muted-foreground/80 whitespace-pre-wrap break-words overflow-x-hidden">
                                                        {contentDetails.description}
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
                                                        onClick={() => handleVideoClick(contentDetails.id)}
                                                    >
                                                        <img
                                                            src={contentDetails.thumbnail}
                                                            alt={contentDetails.title}
                                                            className="w-full aspect-video object-cover"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
                                                        {contentDetails.title}
                                                    </h2>
                                                    {isPlaylist(contentDetails) && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs text-muted-foreground/90">
                                                                {contentDetails.channelName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground/60">•</span>
                                                            <span className="text-xs text-muted-foreground/80">
                                                                {contentDetails.videoCount} videos
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="h-px bg-border/50" />

                                            {isPlaylist(contentDetails) && (
                                                <div className="space-y-4">
                                                    {contentDetails.videos.map((video: VideoItem, index: number) => (
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
