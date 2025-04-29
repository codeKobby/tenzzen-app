"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"

// Form validation schema
const taskFormSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    type: z.enum(["assignment", "quiz", "project"]),
    description: z.string().optional(),
    date: z.date({
        required_error: "Please select a date",
    }),
    dueTime: z.string().optional()
})

type TaskFormValues = z.infer<typeof taskFormSchema>

// Props for the component
interface TaskCreationModalProps {
    isOpen: boolean
    onClose: () => void
    onAddTask: (task: TaskFormValues) => void
    defaultDate?: Date
    editingTask?: {
        id: number
        title: string
        type: "assignment" | "quiz" | "project"
        date: Date
        dueTime?: string
        description?: string
    }
    onUpdateTask?: (id: number, task: TaskFormValues) => void
}

export function TaskCreationModal({
    isOpen,
    onClose,
    onAddTask,
    defaultDate = new Date(),
    editingTask,
    onUpdateTask
}: TaskCreationModalProps) {
    // Initialize form with default values
    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            title: "",
            type: "assignment",
            description: "",
            date: defaultDate,
            dueTime: ""
        }
    })

    // Update form values when editing a task
    useEffect(() => {
        if (editingTask) {
            form.reset({
                title: editingTask.title,
                type: editingTask.type,
                description: editingTask.description || "",
                date: editingTask.date,
                dueTime: editingTask.dueTime || ""
            })
        } else {
            form.reset({
                title: "",
                type: "assignment",
                description: "",
                date: defaultDate,
                dueTime: ""
            })
        }
    }, [editingTask, defaultDate, form])

    const onSubmit = (values: TaskFormValues) => {
        if (editingTask && onUpdateTask) {
            onUpdateTask(editingTask.id, values)
        } else {
            onAddTask(values)
        }
        form.reset()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter task title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select task type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="assignment">Assignment</SelectItem>
                                            <SelectItem value="quiz">Quiz</SelectItem>
                                            <SelectItem value="project">Project</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter task description"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time (Optional)</FormLabel>
                                        <div className="flex items-center">
                                            <FormControl>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="time"
                                                        placeholder="Due time"
                                                        className="pl-9"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingTask ? "Update" : "Add"} Task
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}