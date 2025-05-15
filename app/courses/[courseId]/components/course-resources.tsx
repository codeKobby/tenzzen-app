"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
    sourceType?: string;
}

export function CourseResources({ course }: CourseResourcesProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [resourceType, setResourceType] = useState("all")

    // Get resources from course metadata or use defaults
    const allResources: Resource[] = course.metadata?.resources || [
        {
            title: "Course Supplementary Materials",
            type: "link",
            url: "https://example.com/resources",
            description: "Additional materials to support your learning"
        },
        {
            title: "Recommended Reading",
            type: "article",
            url: "https://example.com/reading",
            description: "Articles and guides related to this course"
        },
        {
            title: "Practice Exercises",
            type: "pdf",
            url: "#",
            description: "Exercises to reinforce your learning"
        },
        {
            title: "Project Templates",
            type: "code",
            url: "https://github.com/example/templates",
            description: "Starter templates for course projects"
        },
        {
            title: "Video Tutorials",
            type: "video",
            url: "https://www.youtube.com/watch?v=example",
            description: "Additional video tutorials on key concepts"
        }
    ]

    // Filter resources based on search and type
    const filteredResources = allResources.filter(resource => {
        const matchesSearch = searchQuery === "" ||
            resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesType = resourceType === "all" || resource.type === resourceType

        return matchesSearch && matchesType
    })

    // Get icon for resource type
    const getResourceIcon = (type: string) => {
        switch (type) {
            case "video":
                return <Video className="h-4 w-4" />
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
                    value={resourceType}
                    onValueChange={setResourceType}
                    className="w-full sm:w-auto"
                >
                    <TabsList className="grid grid-cols-5 w-full sm:w-auto">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="video">Videos</TabsTrigger>
                        <TabsTrigger value="article">Articles</TabsTrigger>
                        <TabsTrigger value="pdf">PDFs</TabsTrigger>
                        <TabsTrigger value="code">Code</TabsTrigger>
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
                                resource.type === "video" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                    resource.type === "article" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                        resource.type === "pdf" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                            resource.type === "code" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                                "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                            )}>
                                {getResourceIcon(resource.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-base">{resource.title}</h3>
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
