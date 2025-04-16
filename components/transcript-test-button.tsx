"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, FileText } from "lucide-react"
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"

interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
}

export function TranscriptTestButton() {
    const [open, setOpen] = useState(false)
    const [videoId, setVideoId] = useState("")
    const [loading, setLoading] = useState(false)
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchTranscript = async () => {
        if (!videoId) {
            setError("Please enter a YouTube video ID")
            return
        }

        setError(null)
        setLoading(true)

        try {
            const result = await getYoutubeTranscript(videoId)
            setTranscript(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch transcript")
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Test Transcript
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>YouTube Transcript Test</DialogTitle>
                    <DialogDescription>
                        Enter a YouTube video ID to fetch and display its transcript.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Enter YouTube video ID (e.g., dQw4w9WgXcQ)"
                            value={videoId}
                            onChange={(e) => setVideoId(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            onClick={fetchTranscript}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Fetch"
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    {transcript.length > 0 && (
                        <div className="border rounded-md p-4 h-[300px] overflow-y-auto">
                            {transcript.map((segment, index) => (
                                <div key={index} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
                                    <div className="text-xs text-muted-foreground">{formatTime(segment.start)}</div>
                                    <div>{segment.text}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}