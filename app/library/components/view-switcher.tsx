"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, List, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "grid" | "list" | "course"

interface ViewSwitcherProps {
    currentView: ViewMode
    onViewChange: (view: ViewMode) => void
    className?: string
}

export function ViewSwitcher({ currentView, onViewChange, className }: ViewSwitcherProps) {
    return (
        <Tabs
            value={currentView}
            onValueChange={(value) => onViewChange(value as ViewMode)}
            className={cn("w-fit", className)}
        >
            <TabsList className="grid grid-cols-3 h-9">
                <TabsTrigger value="grid" className="px-3">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3">
                    <List className="h-4 w-4 mr-2" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">List</span>
                </TabsTrigger>
                <TabsTrigger value="course" className="px-3">
                    <Layers className="h-4 w-4 mr-2" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">Courses</span>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
