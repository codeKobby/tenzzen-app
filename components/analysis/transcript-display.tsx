"use client"

import React, { useState, useEffect, useRef } from 'react'
import { TranscriptSegment } from "@/actions/getYoutubeTranscript"
import { ChevronDown, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface VideoTranscriptProps {
    videoId: string
    title: string
    transcript: TranscriptSegment[]
    loading?: boolean
}

interface PlaylistTranscriptProps {
    videos: {
        videoId: string
        title: string
        transcript: TranscriptSegment[] | null
        loading?: boolean
    }[]
}

// Format seconds to MM:SS timestamp
function formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Component to display a single video's transcript
export function VideoTranscript({ videoId, title, transcript, loading = false }: VideoTranscriptProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{title}</h3>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-2">
                            <Skeleton className="w-12 h-6 rounded" />
                            <Skeleton className="w-full h-6 rounded" />
                        </div>
                    ))}
                </div>
            ) : transcript.length > 0 ? (
                <div className="space-y-1.5">
                    {transcript.map((segment, idx) => (
                        <div key={`${videoId}-segment-${idx}`} className="flex gap-2 group hover:bg-secondary/40 p-1.5 rounded-md transition-colors">
                            <div className="text-xs text-muted-foreground font-mono whitespace-nowrap pt-0.5 min-w-[50px]">
                                {formatTimestamp(segment.offset)}
                            </div>
                            <div className="text-sm">{segment.text}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4 text-muted-foreground text-sm">
                    No transcript available
                </div>
            )}
        </div>
    )
}

// Component to display playlist transcripts in accordion
export function PlaylistTranscript({ videos }: PlaylistTranscriptProps) {
    const [openVideo, setOpenVideo] = useState<string | null>(null)
    const videoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    // Scroll to the opened video section
    useEffect(() => {
        if (openVideo && videoRefs.current[openVideo]) {
            videoRefs.current[openVideo]?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
        }
    }, [openVideo])

    const handleVideoOpen = (videoId: string) => {
        setOpenVideo(prevOpen => prevOpen === videoId ? null : videoId)
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Playlist Transcripts</h3>

            <Accordion
                type="single"
                collapsible
                value={openVideo || undefined}
                className="space-y-2"
            >
                {videos.map((video) => (
                    <AccordionItem
                        key={video.videoId}
                        value={video.videoId}
                        className="border rounded-md overflow-hidden"
                        ref={el => videoRefs.current[video.videoId] = el}
                    >
                        <AccordionTrigger
                            onClick={() => handleVideoOpen(video.videoId)}
                            className="p-3 hover:bg-secondary/40 text-sm"
                        >
                            {video.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1 max-h-[400px] overflow-y-auto">
                            {video.loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex gap-2">
                                            <Skeleton className="w-12 h-6 rounded" />
                                            <Skeleton className="w-full h-6 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : video.transcript && video.transcript.length > 0 ? (
                                <div className="space-y-1.5">
                                    {video.transcript.map((segment, idx) => (
                                        <div key={`${video.videoId}-segment-${idx}`} className="flex gap-2 group hover:bg-secondary/30 p-1.5 rounded-md transition-colors">
                                            <div className="text-xs text-muted-foreground font-mono whitespace-nowrap pt-0.5 min-w-[50px]">
                                                {formatTimestamp(segment.offset)}
                                            </div>
                                            <div className="text-sm">{segment.text}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-4 text-muted-foreground text-sm">
                                    No transcript available
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

// Main component that decides which display to use
export function TranscriptDisplay({
    videoId,
    title,
    transcript,
    loading = false,
    isPlaylist = false,
    videos = []
}: {
    videoId?: string
    title?: string
    transcript?: TranscriptSegment[]
    loading?: boolean
    isPlaylist?: boolean
    videos?: {
        videoId: string
        title: string
        transcript: TranscriptSegment[] | null
        loading?: boolean
    }[]
}) {
    if (isPlaylist) {
        return <PlaylistTranscript videos={videos} />;
    } else if (videoId && title) {
        return <VideoTranscript videoId={videoId} title={title} transcript={transcript || []} loading={loading} />;
    } else {
        return (
            <div className="text-center p-4 text-muted-foreground">
                No transcript data available
            </div>
        );
    }
}
