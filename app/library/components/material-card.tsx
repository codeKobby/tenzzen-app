"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    FileText,
    Link2,
    MoreVertical,
    ExternalLink,
    Trash2,
    Clock,
    Sparkles,
    Play,
    FileUp,
    Headphones,
    Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMaterial } from "@/hooks/use-materials";
import { formatDistanceToNow } from "date-fns";

interface MaterialCardProps {
    material: UserMaterial;
    view?: "grid" | "list";
    onStudy?: () => void;
    onDelete?: () => void;
    onAudioAction?: () => void;
}

const typeIcons = {
    pdf: FileText,
    doc: FileText,
    txt: FileUp,
    url: Link2,
};

const typeColors = {
    pdf: "bg-red-500/10 text-red-500",
    doc: "bg-blue-500/10 text-blue-500",
    txt: "bg-emerald-500/10 text-emerald-500",
    url: "bg-purple-500/10 text-purple-500",
};

export function MaterialCard({
    material,
    view = "grid",
    onStudy,
    onDelete,
    onAudioAction,
}: MaterialCardProps) {
    const Icon = typeIcons[material.fileType];
    const colorClass = typeColors[material.fileType];

    const hasRecommendations =
        material.recommendedVideos && material.recommendedVideos.length > 0;

    const hasAudio = !!material.audioScript;

    if (view === "list") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
            >
                <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div
                                className={cn(
                                    "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
                                    colorClass
                                )}
                            >
                                <Icon className="h-6 w-6" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium truncate">{material.title}</h3>
                                    {hasRecommendations && (
                                        <Badge variant="secondary" className="flex-shrink-0">
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {material.recommendedVideos!.length} videos
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <span className="capitalize">{material.fileType}</span>
                                    {material.category && (
                                        <>
                                            <span>•</span>
                                            <span className="capitalize">{material.category}</span>
                                        </>
                                    )}
                                    {material.lastStudiedAt && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(material.lastStudiedAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" onClick={onStudy}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Study
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {material.sourceUrl && (
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={material.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Open Source
                                                </a>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={onDelete}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Grid view
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <Card className="h-full hover:border-primary/30 transition-colors overflow-hidden">
                {/* Header with pattern */}
                <div
                    className={cn(
                        "h-24 relative",
                        material.fileType === "pdf" && "bg-gradient-to-br from-red-500/20 to-red-600/10",
                        material.fileType === "doc" && "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
                        material.fileType === "txt" && "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
                        material.fileType === "url" && "bg-gradient-to-br from-purple-500/20 to-purple-600/10"
                    )}
                >
                    <div className="pattern-dots absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className={cn(
                                "h-14 w-14 rounded-xl flex items-center justify-center",
                                "bg-background/80 backdrop-blur-sm shadow-lg",
                                colorClass
                            )}
                        >
                            <Icon className="h-7 w-7" />
                        </div>
                    </div>

                    {/* Dropdown */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {material.sourceUrl && (
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={material.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open Source
                                        </a>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-2 mb-2">{material.title}</h3>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                        {material.category && (
                            <Badge variant="secondary" className="text-xs capitalize">
                                {material.category}
                            </Badge>
                        )}
                        {hasRecommendations && (
                            <Badge
                                variant="outline"
                                className="text-xs bg-primary/5 border-primary/20 text-primary"
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                {material.recommendedVideos!.length} videos
                            </Badge>
                        )}
                    </div>

                    {material.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {material.summary}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                                "text-muted-foreground",
                                hasAudio && "text-primary hover:text-primary"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onAudioAction?.();
                            }}
                        >
                            {hasAudio ? (
                                <>
                                    <Headphones className="h-4 w-4 mr-1" />
                                    Play Audio
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4 mr-1" />
                                    Generate Audio
                                </>
                            )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onStudy}>
                            <Play className="h-4 w-4 mr-1" />
                            Study
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function MaterialCardSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
    if (view === "list") {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg skeleton" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-48 skeleton rounded" />
                            <div className="h-4 w-32 skeleton rounded" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full overflow-hidden">
            <div className="h-24 skeleton" />
            <CardContent className="p-4 space-y-3">
                <div className="h-5 w-3/4 skeleton rounded" />
                <div className="h-4 w-1/2 skeleton rounded" />
                <div className="h-4 w-full skeleton rounded" />
            </CardContent>
        </Card>
    );
}
