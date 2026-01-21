"use client"

import { Plus, Play, Search, Lightbulb, BookOpen, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface QuickAction {
    id: string
    label: string
    icon: "plus" | "play" | "search" | "tip" | "note" | "course"
    onClick?: () => void
}

interface QuickActionsProps {
    actions?: QuickAction[]
    className?: string
}

const iconMap = {
    plus: Plus,
    play: Play,
    search: Search,
    tip: Lightbulb,
    note: PenLine,
    course: BookOpen,
}

const defaultActions: QuickAction[] = [
    { id: "new-note", label: "New Note", icon: "note" },
    { id: "start-review", label: "Start Review", icon: "play" },
    { id: "search", label: "Search", icon: "search" },
    { id: "daily-tip", label: "Daily Tip", icon: "tip" },
]

export function QuickActions({ actions = defaultActions, className }: QuickActionsProps) {
    return (
        <div className={cn("widget-section", className)}>
            <div className="widget-header">
                <h3 className="widget-title">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {actions.map((action) => {
                    const Icon = iconMap[action.icon]

                    return (
                        <Tooltip key={action.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-full border-border/50 hover:border-primary/30 hover:bg-primary/5"
                                    onClick={action.onClick}
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{action.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </div>
    )
}
