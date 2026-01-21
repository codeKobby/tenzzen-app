"use client"

import { BookOpen, ChevronRight, GraduationCap, Languages } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudyQueueItem {
    id: string
    title: string
    dueCount: number
    icon?: "book" | "language" | "general"
}

interface StudyQueueProps {
    items?: StudyQueueItem[]
    onStartReview?: (id: string) => void
    className?: string
}

const iconMap = {
    book: BookOpen,
    language: Languages,
    general: GraduationCap,
}

export function StudyQueue({ items = [], onStartReview, className }: StudyQueueProps) {
    // Default items if none provided
    const displayItems: StudyQueueItem[] = items.length > 0 ? items : [
        { id: "1", title: "Course Vocabulary", dueCount: 15, icon: "language" },
        { id: "2", title: "Key Concepts", dueCount: 8, icon: "book" },
    ]

    return (
        <div className={cn("widget-section", className)}>
            <div className="widget-header">
                <h3 className="widget-title">Study Queue</h3>
                <span className="widget-action">View all</span>
            </div>

            <div className="space-y-2">
                {displayItems.map((item) => {
                    const Icon = iconMap[item.icon || "general"]

                    return (
                        <div
                            key={item.id}
                            className="list-item group"
                            onClick={() => onStartReview?.(item.id)}
                        >
                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.dueCount} cards due</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )
                })}
            </div>

            {displayItems.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    No cards due for review
                </div>
            )}
        </div>
    )
}
