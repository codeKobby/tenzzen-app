"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp, Eye, ThumbsUp, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface VideoResult {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: string;
    relevance: number;
    benefit: string;
    viewCount?: string;
    likeCount?: string;
    publishDate?: string;
    description?: string;
}

interface AiVideoResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    results: VideoResult[];
    searchStage?: string;
}

// Add a skeleton shimmer effect for loading state
function VideoResultsSkeleton() {
    return (
        <div className="space-y-4 py-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-lg border bg-muted/30 animate-pulse">
                    <div className="flex-shrink-0 w-28 h-16 rounded overflow-hidden bg-secondary/60" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted/70 rounded" />
                        <div className="h-3 w-2/3 bg-muted/50 rounded" />
                        <div className="h-8 w-20 bg-muted/40 rounded mt-2" />
                    </div>
                </div>
            ))}
            <div className="flex flex-col items-center mt-6">
                <div className="w-2/3 h-2 bg-primary/30 rounded-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 h-full bg-primary animate-progress-bar" style={{ width: '60%' }} />
                </div>
                <span className="text-xs text-muted-foreground mt-2">Finding the best videos for you...</span>
            </div>
        </div>
    );
}

// Add a better loading overlay for the AI process
function VideoLoadingOverlay({ searchStage }: { searchStage: string }) {
    // Define the stages and their corresponding display text and completion percentages
    const stages = {
        initializing: { text: "Initializing AI recommendation engine...", progress: 10 },
        analyzingQuery: { text: "Analyzing your learning goals...", progress: 25 },
        searchingVideos: { text: "Searching for the most relevant videos...", progress: 50 },
        analyzingContent: { text: "Analyzing video content and transcripts...", progress: 75 },
        rankingResults: { text: "Ranking and selecting the best videos for you...", progress: 90 },
        finishing: { text: "Finalizing recommendations...", progress: 95 },
        error: { text: "An error occurred connecting to the AI service.", progress: 100, isError: true }
    };

    const currentStage = stages[searchStage as keyof typeof stages] || stages.initializing;
    const isError = currentStage.isError;

    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
            <div className="w-full max-w-md bg-card rounded-lg border shadow-lg p-6 flex flex-col items-center">
                {isError ? (
                    <>
                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-destructive">Connection Error</h3>
                        <p className="text-center text-muted-foreground mb-4">{currentStage.text}</p>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            Please ensure the AI service is running at http://localhost:8000
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 mb-4 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        </div>

                        <h3 className="text-xl font-semibold mb-2">Finding Educational Content</h3>
                        <p className="text-center text-muted-foreground mb-4">{currentStage.text}</p>

                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-in-out"
                                style={{ width: `${currentStage.progress}%` }}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                            This may take a moment as we analyze and rank videos for the best learning experience
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export function AiVideoResultsModal({ isOpen, onClose, loading, results, searchStage = "initializing" }: AiVideoResultsModalProps) {
    const router = useRouter();
    const [expandedVideos, setExpandedVideos] = React.useState<Set<string>>(new Set());

    const [isNavigating, setIsNavigating] = React.useState(false);

    const handleSelect = (videoId: string) => {
        if (!videoId) {
            console.error("Invalid video ID");
            return;
        }

        try {
            setIsNavigating(true);
            onClose();
            // Navigate to the analysis page for course generation
            router.push(`/analysis/${videoId}`);
        } catch (error) {
            console.error("Navigation error:", error);
            setIsNavigating(false);
        }
    };

    const toggleExpand = (videoId: string) => {
        setExpandedVideos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(videoId)) {
                newSet.delete(videoId);
            } else {
                newSet.add(videoId);
            }
            return newSet;
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90%] max-w-md mx-auto max-h-[80vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                    <DialogTitle>AI Video Recommendations</DialogTitle>
                    <DialogDescription>
                        Select a video to analyze and generate a structured course.
                    </DialogDescription>
                </DialogHeader>

                {/* Show the loading overlay when in loading state */}
                {loading && (
                    <div className="relative min-h-[400px]">
                        <VideoLoadingOverlay searchStage={searchStage} />
                        <VideoResultsSkeleton />
                    </div>
                )}

                {!loading && results.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No relevant videos found. Try adjusting your search criteria.
                    </div>
                ) : !loading && (
                    <div className="space-y-4">
                        {results.map((video) => {
                            const isExpanded = expandedVideos.has(video.id);
                            return (
                                <div key={video.id} className="rounded-lg border hover:bg-muted/30 transition">
                                    <div className="flex gap-4 p-3">
                                        <div className="flex-shrink-0 w-28 h-16 rounded overflow-hidden bg-secondary">
                                            {video.thumbnail ? (
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No thumbnail</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2 mb-1">
                                                <h3 className="font-medium text-base line-clamp-2 flex-1">{video.title}</h3>
                                                <Badge variant="secondary" className="ml-2 flex items-center gap-1 flex-shrink-0">
                                                    <Star className="h-3 w-3 text-yellow-500" />
                                                    {video.relevance.toFixed(1)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                <span>{video.channel}</span>
                                                <span>•</span>
                                                <span>{video.duration}</span>
                                            </div>

                                            {/* Benefit summary section with expand/collapse */}
                                            <div className="mt-2 mb-2">
                                                <div className="text-sm font-medium mb-1">Why this video is relevant:</div>
                                                <p className={cn(
                                                    "text-sm text-muted-foreground/90",
                                                    !isExpanded && "line-clamp-2"
                                                )}>
                                                    {video.benefit}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSelect(video.id)}
                                                    disabled={isNavigating}
                                                >
                                                    {isNavigating ? "Navigating..." : "Select"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleExpand(video.id)}
                                                    className="text-xs flex items-center gap-1"
                                                >
                                                    {isExpanded ? (
                                                        <>Show less <ChevronUp className="h-3 w-3" /></>
                                                    ) : (
                                                        <>Show more <ChevronDown className="h-3 w-3" /></>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded details section */}
                                    {isExpanded && (
                                        <div className="px-3 pb-3 pt-1 border-t mt-1 bg-muted/20">
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm">
                                                {video.viewCount && (
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{video.viewCount} views</span>
                                                    </div>
                                                )}
                                                {video.likeCount && (
                                                    <div className="flex items-center gap-1">
                                                        <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{video.likeCount} likes</span>
                                                    </div>
                                                )}
                                                {video.publishDate && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>Published: {video.publishDate}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {video.description && video.description !== video.benefit && (
                                                <div className="mt-3">
                                                    <div className="text-sm font-medium mb-1">Description:</div>
                                                    <p className="text-sm text-muted-foreground/90 whitespace-pre-line line-clamp-3">
                                                        {video.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
