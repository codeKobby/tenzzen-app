"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, ExternalLink, File, FileText, Search, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { NormalizedCourse } from "@/hooks/use-normalized-course"

interface CourseResourcesProps {
    course: NormalizedCourse
}

interface Resource {
    title: string;
    type: string;
    url: string;
    description?: string;
    category?: string;
    sourceType?: string;
}

export function CourseResources({ course }: CourseResourcesProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [resourceCategory, setResourceCategory] = useState("all")

    // Get resources from course metadata (excluding Social links as they're in the header)
    const allResources: Resource[] = (course.metadata?.resources || []).filter((r: Resource) => r.category !== "Social")

    // Separate resources by category (Social links are excluded)
    const creatorLinks = allResources.filter(r => r.category === "Creator Links")
    const otherResources = allResources.filter(r => r.category === "Other Resources")

    // Filter resources based on search and category
    const getFilteredResources = () => {
        let resources = allResources

        if (resourceCategory !== "all") {
            resources = allResources.filter(r => r.category === resourceCategory)
        }

        if (searchQuery) {
            resources = resources.filter(resource =>
                resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
        }

        return resources
    }

    const filteredResources = getFilteredResources()

    // Get icon for resource based on category and type
    const getResourceIcon = (resource: Resource) => {
        if (resource.category === "Social") {
            // Social media specific icons would go here
            // For now, use a generic link icon
            return <ExternalLink className="h-4 w-4" />
        }

        switch (resource.type?.toLowerCase()) {
            case "video":
                return <Video className="h-4 w-4" />
            case "documentation":
            case "article":
                return <FileText className="h-4 w-4" />
            case "pdf":
                return <File className="h-4 w-4" />
            case "code":
                return <BookOpen className="h-4 w-4" />
            default:
                return <ExternalLink className="h-4 w-4" />
        }
    }

    // Get color scheme based on category
    const getResourceColor = (category: string) => {
        switch (category) {
            case "Social":
                return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            case "Creator Links":
                return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            case "Other Resources":
                return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            default:
                return "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"
        }
    }

    return (
        <div className="space-y-6">
            {/* Search and filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Tabs
                    value={resourceCategory}
                    onValueChange={setResourceCategory}
                    className="w-full sm:w-auto"
                >
                    <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                        <TabsTrigger value="all">All ({allResources.length})</TabsTrigger>
                        <TabsTrigger value="Creator Links">Creator ({creatorLinks.length})</TabsTrigger>
                        <TabsTrigger value="Other Resources">Other ({otherResources.length})</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Resource list */}
            {filteredResources.length > 0 ? (
                <div className="space-y-4">
                    {filteredResources.map((resource, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                getResourceColor(resource.category || "Other Resources")
                            )}>
                                {getResourceIcon(resource)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-base">{resource.title}</h3>
                                    <Badge variant="outline" className="text-xs">
                                        {resource.category || "Resource"}
                                    </Badge>
                                </div>
                                {resource.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                asChild
                            >
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    Open
                                </a>
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No resources found matching your criteria.</p>
                </div>
            )}
        </div>
    )
}
