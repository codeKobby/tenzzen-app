"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Clock, Calendar as CalendarIcon } from "lucide-react"

interface Task {
    id: number
    title: string
    date: Date
    type: "assignment" | "quiz" | "project"
    dueTime?: string
    description?: string
    completed?: boolean
}

interface TaskDetailModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date | null
    tasks: Task[]
    onEditTask?: (task: Task) => void
    onDeleteTask?: (taskId: number) => void
    onCompleteTask?: (taskId: number, completed: boolean) => void
}

export function TaskDetailModal({
    isOpen,
    onClose,
    selectedDate,
    tasks,
    onEditTask,
    onDeleteTask,
    onCompleteTask
}: TaskDetailModalProps) {
    if (!selectedDate) return null

    const tasksForDate = tasks.filter(task =>
        selectedDate && task.date &&
        task.date.toDateString() === selectedDate.toDateString()
    )

    // Format time from 24hr to 12hr format with AM/PM
    const formatTime = (time?: string) => {
        if (!time) return ""

        try {
            const [hours, minutes] = time.split(':').map(Number)
            if (isNaN(hours) || isNaN(minutes)) return ""

            const period = hours >= 12 ? 'PM' : 'AM'
            const displayHours = hours % 12 || 12

            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
        } catch (error) {
            return ""
        }
    }

    // Get badge color based on task type
    const getTaskBadgeColor = (type: string) => {
        switch (type) {
            case "assignment": return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
            case "project": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            case "quiz": return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300"
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                    </DialogTitle>
                    <DialogDescription>
                        {tasksForDate.length
                            ? `You have ${tasksForDate.length} task${tasksForDate.length !== 1 ? 's' : ''} for this day.`
                            : 'No tasks scheduled for this day.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2">
                    {tasksForDate.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No tasks scheduled for this day.</p>
                            <p className="text-xs text-muted-foreground mt-1">Click 'Add Task' to create one.</p>
                        </div>
                    ) : (
                        tasksForDate.map((task) => (
                            <div key={task.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{task.title}</h3>
                                            <Badge className={getTaskBadgeColor(task.type)}>
                                                {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                                            </Badge>
                                        </div>

                                        {task.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                        )}
                                    </div>

                                    {task.completed !== undefined && (
                                        <div className="flex items-center">
                                            <input
                                                id={`task-complete-${task.id}`}
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => onCompleteTask?.(task.id, !task.completed)}
                                                className="h-5 w-5"
                                                aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                                            />
                                            <label htmlFor={`task-complete-${task.id}`} className="sr-only">
                                                Mark {task.title} as {task.completed ? 'incomplete' : 'complete'}
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {task.dueTime && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5 mr-1" />
                                        Due at {formatTime(task.dueTime)}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    {onEditTask && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => onEditTask(task)}
                                        >
                                            Edit
                                        </Button>
                                    )}

                                    {onDeleteTask && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => onDeleteTask(task.id)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}