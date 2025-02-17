"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Youtube, Bot } from "lucide-react"

interface CourseGenerationModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CourseGenerationModal({ isOpen, onClose }: CourseGenerationModalProps) {
    const [activeTab, setActiveTab] = useState("youtube")
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const [prompt, setPrompt] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            // Handle course generation logic here
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
            <DialogContent className="max-w-[425px] mx-auto h-auto max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">Generate New Course</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        Create a custom course from YouTube content or describe what you want to learn.
                    </DialogDescription>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="youtube" className="flex items-center gap-2">
                            <Youtube className="h-4 w-4" />
                            YouTube
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            AI Generate
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="youtube" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="youtube-url" className="text-sm sm:text-base">YouTube URL</Label>
                            <Input
                                id="youtube-url"
                                placeholder="Paste video or playlist URL"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                className="text-sm sm:text-base"
                            />
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Enter a YouTube video or playlist URL to generate a structured course.
                            </p>
                        </div>
                    </TabsContent>
                    <TabsContent value="ai" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt" className="text-sm sm:text-base">What do you want to learn?</Label>
                            <Input
                                id="prompt"
                                placeholder="e.g., Learn Python for beginners"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="text-sm sm:text-base"
                            />
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Describe what you want to learn and AI will generate a course structure.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Generating..." : "Generate Course"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}