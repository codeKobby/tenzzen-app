"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ThumbsUp, Clock, Calendar, User, Play, ListVideo } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    onGenerate: () => void
    videoUrl: string
}

// Individual video data structure
interface VideoItem {
    id: string
    title: string
    thumbnail: string
    channelName: string
    views: string
    publishDate: string
    duration: string
}

// Single video details
interface SingleVideoDetails {
    type: "video"
    id: string
    title: string
    description: string
    thumbnail: string
    channelName: string
    channelAvatar?: string
    likes: string
    views: string
    publishDate: string
    duration: string
}

// Playlist details
interface PlaylistDetails {
    type: "playlist"
    id: string
    title: string
    description: string
    thumbnail: string
    channelName: string
    channelAvatar?: string
    videoCount: number
    videos: VideoItem[]
}

// Combined type for content that can be displayed
type ContentDetails = SingleVideoDetails | PlaylistDetails;

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

    // Extract video/playlist ID from URL
    const parseYoutubeUrl = (url: string): { type: 'video' | 'playlist', id: string } | null => {
        // Handle video URLs
        const videoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const videoMatch = url.match(videoRegex);

        if (videoMatch && videoMatch[1]) {
            return { type: 'video', id: videoMatch[1] };
        }

        // Handle playlist URLs
        const playlistRegex = /[?&]list=([^&]+)/i;
        const playlistMatch = url.match(playlistRegex);

        if (playlistMatch && playlistMatch[1]) {
            return { type: 'playlist', id: playlistMatch[1] };
        }

        return null;
    };

    useEffect(() => {
        if (isOpen && videoUrl) {
            setLoading(true);
            const urlInfo = parseYoutubeUrl(videoUrl);

            // In a real implementation, we'd fetch actual data based on the URL
            setTimeout(() => {
                if (!urlInfo) {
                    // Handle invalid URL
                    setLoading(false);
                    return;
                }

                if (urlInfo.type === 'video') {
                    // Mock data for a single video
                    const mockVideoData: SingleVideoDetails = {
                        type: "video",
                        id: urlInfo.id,
                        title: "Building a Modern Web Application with Next.js 14",
                        description: "Learn how to build a full-stack application using Next.js 14, React Server Components, Tailwind CSS, and more. This comprehensive tutorial covers everything from setup to deployment.",
                        thumbnail: "https://i.ytimg.com/vi/843nec-IvW0/maxresdefault.jpg",
                        channelName: "Code With Expert",
                        channelAvatar: "https://yt3.googleusercontent.com/ytc/APkrFKaqca-xQcJtp1Pqv-APucGfqTqYHahZTgF4aGIQ=s176-c-k-c0x00ffffff-no-rj",
                        likes: "15K",
                        views: "230K",
                        publishDate: "2 months ago",
                        duration: "1:24:36"
                    };

                    setContentDetails(mockVideoData);
                    setActiveVideoId(urlInfo.id);
                } else {
                    // Mock data for playlist
                    const mockPlaylistVideos: VideoItem[] = [
                        {
                            id: "video1",
                            title: "Next.js 14 Tutorial #1 - Introduction & Setup",
                            thumbnail: "https://i.ytimg.com/vi/843nec-IvW0/mqdefault.jpg",
                            channelName: "Code With Expert",
                            views: "120K",
                            publishDate: "2 months ago",
                            duration: "15:22"
                        },
                        {
                            id: "video2",
                            title: "Next.js 14 Tutorial #2 - Server Components & Client Components",
                            thumbnail: "https://i.ytimg.com/vi/second-id/mqdefault.jpg",
                            channelName: "Code With Expert",
                            views: "98K",
                            publishDate: "2 months ago",
                            duration: "20:15"
                        },
                        {
                            id: "video3",
                            title: "Next.js 14 Tutorial #3 - Building the API",
                            thumbnail: "https://i.ytimg.com/vi/third-id/mqdefault.jpg",
                            channelName: "Code With Expert",
                            views: "85K",
                            publishDate: "2 months ago",
                            duration: "18:47"
                        },
                        {
                            id: "video4",
                            title: "Next.js 14 Tutorial #4 - Authentication with Clerk",
                            thumbnail: "https://i.ytimg.com/vi/fourth-id/mqdefault.jpg",
                            channelName: "Code With Expert",
                            views: "76K",
                            publishDate: "2 months ago",
                            duration: "22:30"
                        },
                        {
                            id: "video5",
                            title: "Next.js 14 Tutorial #5 - Database Integration",
                            thumbnail: "https://i.ytimg.com/vi/fifth-id/mqdefault.jpg",
                            channelName: "Code With Expert",
                            views: "65K",
                            publishDate: "2 months ago",
                            duration: "25:18"
                        }
                    ];

                    const mockPlaylistData: PlaylistDetails = {
                        type: "playlist",
                        id: urlInfo.id,
                        title: "Next.js 14 - Complete Course",
                        description: "A comprehensive tutorial series for building modern web applications with Next.js 14. We cover everything from setup to deployment, including React Server Components, authentication, and database integration.",
                        thumbnail: "https://i.ytimg.com/vi/843nec-IvW0/maxresdefault.jpg",
                        channelName: "Code With Expert",
                        channelAvatar: "https://yt3.googleusercontent.com/ytc/APkrFKaqca-xQcJtp1Pqv-APucGfqTqYHahZTgF4aGIQ=s176-c-k-c0x00ffffff-no-rj",
                        videoCount: mockPlaylistVideos.length,
                        videos: mockPlaylistVideos
                    };

                    setContentDetails(mockPlaylistData);
                    setActiveVideoId(mockPlaylistVideos[0].id);
                }

                setLoading(false);
            }, 1500);
        }
    }, [isOpen, videoUrl]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // Simulate API call for course generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            onGenerate();
        } catch (error) {
            console.error("Error generating course:", error);
        } finally {
            setGenerating(false);
        }
    };

    const getEmbedUrl = (videoId: string) => {
        return `https://www.youtube.com/embed/${videoId}`;
    };

    // Handle clicking on a video in the playlist
    const handleVideoSelect = (videoId: string) => {
        setActiveVideoId(videoId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {contentDetails?.type === "playlist" ? "Playlist Analysis" : "Video Analysis"}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-lg text-muted-foreground">Fetching content details...</p>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row h-[65vh]">
                        {/* Left side - Video player */}
                        <div className="md:w-2/3 h-full flex flex-col">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                <iframe
                                    src={activeVideoId ? getEmbedUrl(activeVideoId) : ""}
                                    title={contentDetails?.title}
                                    allowFullScreen
                                    className="w-full h-full"
                                ></iframe>
                            </div>
                            <div className="mt-4 overflow-y-auto">
                                <h3 className="text-xl font-semibold">{contentDetails?.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                            <img
                                                src={contentDetails?.channelAvatar || 'https://ui-avatars.com/api/?name=C'}
                                                alt={contentDetails?.channelName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="font-medium">{contentDetails?.channelName}</span>
                                    </div>
                                    {contentDetails?.type === "playlist" && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <ListVideo className="h-3 w-3" />
                                            {contentDetails.videoCount} videos
                                        </Badge>
                                    )}
                                </div>

                                {contentDetails?.type === "video" && (
                                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <ThumbsUp className="h-4 w-4" />
                                            {contentDetails.likes}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Play className="h-4 w-4" />
                                            {contentDetails.views} views
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {contentDetails.publishDate}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {contentDetails.duration}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-muted/30 rounded-md">
                                    <p className="text-sm text-muted-foreground">
                                        {contentDetails?.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Video list or additional info */}
                        <div className="md:w-1/3 md:ml-4 mt-4 md:mt-0 h-full overflow-hidden">
                            <div className="h-full flex flex-col">
                                <div className="mb-2 px-2 border-b pb-2">
                                    <h4 className="font-semibold">
                                        {contentDetails?.type === "playlist"
                                            ? "Videos in this playlist"
                                            : "What will be generated"}
                                    </h4>
                                </div>

                                <div className="overflow-y-auto flex-grow">
                                    {contentDetails?.type === "playlist" ? (
                                        <div className="space-y-2">
                                            {contentDetails.videos.map((video, index) => (
                                                <div
                                                    key={video.id}
                                                    onClick={() => handleVideoSelect(video.id)}
                                                    className={cn(
                                                        "flex gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50",
                                                        activeVideoId === video.id && "bg-accent"
                                                    )}
                                                >
                                                    <div className="flex-shrink-0 relative">
                                                        <img
                                                            src={video.thumbnail}
                                                            alt={video.title}
                                                            className="w-28 h-16 object-cover rounded"
                                                        />
                                                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                                            {video.duration}
                                                        </div>
                                                        <div className="absolute top-0 left-0 bg-black/80 text-white text-xs px-1 rounded">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-medium text-sm truncate">{video.title}</h5>
                                                        <p className="text-xs text-muted-foreground mt-1">{video.channelName}</p>
                                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                            <span>{video.views} views</span>
                                                            <span className="mx-1">•</span>
                                                            <span>{video.publishDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 px-2">
                                            <h5 className="font-medium text-sm">This course will include:</h5>
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex items-start gap-2">
                                                    <div className="rounded-full p-1 bg-primary/10 mt-0.5">
                                                        <Check className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span>Structured course outline with chapters and lessons</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <div className="rounded-full p-1 bg-primary/10 mt-0.5">
                                                        <Check className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span>Key concepts and learning objectives</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <div className="rounded-full p-1 bg-primary/10 mt-0.5">
                                                        <Check className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span>Interactive timestamps for easy navigation</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <div className="rounded-full p-1 bg-primary/10 mt-0.5">
                                                        <Check className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span>AI-generated quizzes and assessments</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <div className="rounded-full p-1 bg-primary/10 mt-0.5">
                                                        <Check className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span>Personalized note-taking system</span>
                                                </li>
                                            </ul>

                                            <div className="pt-4 border-t mt-4">
                                                <h5 className="font-medium text-sm mb-2">Related content we'll include:</h5>
                                                <div className="space-y-2">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-28 h-16 bg-muted rounded"></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h6 className="font-medium text-xs line-clamp-2">
                                                                    Related Next.js {i} concept video
                                                                </h6>
                                                                <p className="text-xs text-muted-foreground mt-1">Recommended resource</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex flex-row sm:justify-between gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Back
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || generating}
                        className="min-w-[140px]"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : "Generate Course"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Check icon component
function Check(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
