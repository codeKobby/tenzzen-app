"use client"

import { useState, useEffect } from "react"
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
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getVideoDetails, getPlaylistDetails, VideoDetails, PlaylistDetails, VideoItem } from "@/app/actions/youtube"

interface VideoDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    onGenerate: () => void
    videoUrl: string
}

type ContentDetails = VideoDetails | PlaylistDetails;

const isPlaylist = (content: ContentDetails): content is PlaylistDetails => {
    return content.type === "playlist";
};

export function VideoDetailsModal({
    isOpen,
    onClose,
    onGenerate,
    videoUrl
}: VideoDetailsModalProps) {
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
        const videoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const videoMatch = url.match(videoRegex);

        if (videoMatch && videoMatch[1]) {
            return { type: 'video', id: videoMatch[1] };
        }

        const playlistRegex = /[?&]list=([^&]+)/i;
        const playlistMatch = url.match(playlistRegex);

        if (playlistMatch && playlistMatch[1]) {
            return { type: 'playlist', id: playlistMatch[1] };
        }

        return null;
    };

    useEffect(() => {
        const fetchContentDetails = async (urlInfo: { type: 'video' | 'playlist', id: string }): Promise<void> => {
            try {
                if (urlInfo.type === 'video') {
                    const videoData = await getVideoDetails(urlInfo.id);
                    setContentDetails(videoData);
                    setActiveVideoId(urlInfo.id);
                } else {
                    const playlistData = await getPlaylistDetails(urlInfo.id);
                    setContentDetails(playlistData);
                    if (playlistData.videos.length > 0) {
                        setActiveVideoId(playlistData.videos[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching content details:", error);
                setError("Failed to fetch content details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && videoUrl) {
            setLoading(true);
            setError(null);
            const urlInfo = parseYoutubeUrl(videoUrl);

            if (!urlInfo) {
                setLoading(false);
                setError("Invalid YouTube URL. Please provide a valid video or playlist URL.");
                return;
            }

            fetchContentDetails(urlInfo);
        }
    }, [isOpen, videoUrl]);

    const handleGenerate = async (): Promise<void> => {
        setGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            onGenerate();
        } catch (error: any) {
            console.error("Error generating course:", error);
        } finally {
            setGenerating(false);
        }
    };

    const toggleVideoExpand = (videoId: string): void => {
        setExpandedVideoIds((prev: Set<string>) => {
            const newSet = new Set(prev);
            if (prev.has(videoId)) {
                newSet.delete(videoId);
            } else {
                newSet.add(videoId);
            }
            return newSet;
        });
    };

    const toggleDescription = (): void => {
        setShowFullDescription((prev: boolean) => !prev);
    };

    return (
        <>
            <Dialog open={isOpen && !showVideoOpenDialog} onOpenChange={(open: boolean) => !open && setShowCancelDialog(true)}>
                <DialogContent className="max-w-[425px] mx-auto h-auto max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background shadow-lg border border-border rounded-lg p-0">
                    <div className="flex flex-col h-full">
                        {contentDetails?.type !== "playlist" && (
                            <div className="p-6 pb-0">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold tracking-tight">
                                        {loading ? "Loading Content..." : "Video Details"}
                                    </DialogTitle>
                                </DialogHeader>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent p-6">
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

                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
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
                                                            className="h-7 px-2 text-xs text-muted-foreground/70 hover:text-muted-foreground"
                                                        >
                                                            {showFullDescription ? "Hide details" : "Show details"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "space-y-4 transition-all duration-200",
                                                !showFullDescription && "h-0 opacity-0 invisible"
                                            )}>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/70 pb-3 border-b">
                                                    <span>{contentDetails.views} views</span>
                                                    <span>{contentDetails.likes} likes</span>
                                                    <span>{contentDetails.publishDate}</span>
                                                </div>
                                                <div className="text-xs leading-relaxed text-muted-foreground/80 whitespace-pre-wrap">
                                                    {contentDetails.description}
                                                </div>
                                            </div>
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
                                                                            className="h-6 px-2 text-xs text-muted-foreground/70 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                                        >
                                                                            {expandedVideoIds.has(video.id) ? "Hide details" : "Show details"}
                                                                        </Button>
                                                                    </div>

                                                                    <div className={cn(
                                                                        "overflow-hidden transition-all duration-200",
                                                                        expandedVideoIds.has(video.id) ? "max-h-[500px] mt-2" : "max-h-0"
                                                                    )}>
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
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="shrink-0 flex items-center justify-between gap-2 p-6 pt-4 border-t bg-background/95 backdrop-blur-sm">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || loading || !!error || !contentDetails}
                                className="min-w-[120px]"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : "Generate Course"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                    window.open(selectedVideoUrl, '_blank');
                                }
                                setShowVideoOpenDialog(false);
                            }}>
                                Open Video
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Course Generation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel? Any progress will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
                            No, continue
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={onClose}>
                            Yes, cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
