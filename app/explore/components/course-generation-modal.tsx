"use client"

import { useState, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Youtube, Bot, Link, VideoIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CourseGenerationModalProps {
    isOpen: boolean
    onClose: () => void
}

// Knowledge levels for the form
const knowledgeLevels = [
    "Beginner",
    "Intermediate",
    "Advanced"
] as const

type KnowledgeLevel = (typeof knowledgeLevels)[number]

interface FormData {
    title: string
    knowledgeLevel: KnowledgeLevel
    preferredChannels: string[]
    additionalContext: string
}

export function CourseGenerationModal({ isOpen, onClose }: CourseGenerationModalProps) {
    const [activeTab, setActiveTab] = useState("link")
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const [urlError, setUrlError] = useState<string | null>(null)
    const [formData, setFormData] = useState<FormData>({
        title: "",
        knowledgeLevel: "Beginner",
        preferredChannels: [],
        additionalContext: ""
    })
    const [currentChannel, setCurrentChannel] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // YouTube URL validation
    const validateYoutubeUrl = useCallback((url: string) => {
        if (!url) {
            setUrlError("Please enter a URL")
            return false
        }

        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
        if (!youtubeRegex.test(url)) {
            setUrlError("Please enter a valid YouTube URL")
            return false
        }

        setUrlError(null)
        return true
    }, [])

    // Handle channel input
    const handleChannelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    }

    const removeChannel = (channel: string) => {
        setFormData(prev => ({
            ...prev,
            preferredChannels: prev.preferredChannels.filter(c => c !== channel)
        }))
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            if (activeTab === "link") {
                if (!validateYoutubeUrl(youtubeUrl)) {
                    return
                }
                // Process YouTube URL
            } else {
                if (!formData.title) {
                    // Show error for required fields
                    return
                }
                // Process AI generation form
            }
            await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate loading
            onClose()
        } catch (error) {
            console.error("Failed to generate course:", error)
        } finally {
            setIsLoading(false)
        }
    }

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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="link" className="flex items-center gap-2">
                            <VideoIcon className="h-4 w-4" />
                            Direct Link
                        </TabsTrigger>
                        <TabsTrigger value="discover" className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            AI Discovery
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="link" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="youtube-url" className="text-base">
                                YouTube URL
                            </Label>
                            <div className="relative">
                                <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="youtube-url"
                                    placeholder="Paste video or playlist URL"
                                    value={youtubeUrl}
                                    onChange={(e) => {
                                        setYoutubeUrl(e.target.value)
                                        if (urlError) validateYoutubeUrl(e.target.value)
                                    }}
                                    className="pl-9 text-base"
                                />
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
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                <DialogFooter className="flex flex-row flex-nowrap gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={isLoading || (activeTab === "link" ? !youtubeUrl : !formData.title)} 
                        className="flex-1"
                    >
                        {isLoading ? "Generating..." : "Generate Course"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
