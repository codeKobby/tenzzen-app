"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, CalendarIcon, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday as isDateToday,
    addWeeks,
    subWeeks,
    parseISO,
    isValid,
    isSameMonth,
    differenceInCalendarDays,
    startOfMonth,
    endOfMonth,
    getMonth,
    getYear
} from "date-fns"
import { TaskDetailModal } from "./task-detail-modal"
import { TaskCreationModal } from "./task-creation-modal"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Task {
    id: number
    title: string
    date: Date
    type: "assignment" | "quiz" | "project"
    dueTime?: string // Optional due time for the task
    description?: string
    completed?: boolean
}

interface WeeklyCalendarProps {
    tasks: Task[]
    className?: string
}

export function WeeklyCalendar({ tasks, className }: WeeklyCalendarProps) {
    // Normalize any invalid dates in tasks
    const normalizedTasks = useMemo(() => {
        return tasks.map(task => {
            // Ensure that task.date is a valid Date object
            const taskDate = task.date instanceof Date
                ? task.date
                : (typeof task.date === 'string' && isValid(parseISO(task.date))
                    ? parseISO(task.date)
                    : new Date());

            return {
                ...task,
                date: taskDate
            };
        });
    }, [tasks]);

    // State for managing task detail and creation modals
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
    const [isTaskCreationModalOpen, setIsTaskCreationModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
    const [localTasks, setLocalTasks] = useState<Task[]>(normalizedTasks);

    // Use useEffect to update local tasks when normalizedTasks change
    useEffect(() => {
        setLocalTasks(normalizedTasks);
    }, [normalizedTasks]);

    // State for current week
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        // Get start of the current week (Sunday)
        return startOfWeek(new Date(), { weekStartsOn: 0 });
    });

    // Create an array of days for the current week (memoized for performance)
    const weekDays = useMemo(() => {
        return eachDayOfInterval({
            start: currentWeekStart,
            end: endOfWeek(currentWeekStart, { weekStartsOn: 0 })
        });
    }, [currentWeekStart]);

    // Navigate to previous week using useCallback for better performance
    const goToPreviousWeek = useCallback(() => {
        setCurrentWeekStart(prevStart => subWeeks(prevStart, 1));
    }, []);

    // Navigate to next week using useCallback for better performance
    const goToNextWeek = useCallback(() => {
        setCurrentWeekStart(prevStart => addWeeks(prevStart, 1));
    }, []);

    // Reset to current week using useCallback for better performance
    const goToCurrentWeek = useCallback(() => {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
    }, []);

    // Format date range for header using date-fns with improved logic
    const formatDateRange = useMemo(() => {
        const endOfCurrentWeek = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

        // If the start and end months are the same
        if (isSameMonth(currentWeekStart, endOfCurrentWeek)) {
            return `${format(currentWeekStart, 'MMM d')} - ${format(endOfCurrentWeek, 'd, yyyy')}`;
        } else {
            // If the months are different
            return `${format(currentWeekStart, 'MMM d')} - ${format(endOfCurrentWeek, 'MMM d, yyyy')}`;
        }
    }, [currentWeekStart]);

    // Check if the current week is the current week (for Today button disabling)
    const isCurrentWeek = useMemo(() => {
        const today = new Date();
        const thisWeekStart = startOfWeek(today, { weekStartsOn: 0 });
        return isSameDay(thisWeekStart, currentWeekStart);
    }, [currentWeekStart]);

    // Get days until the task date from today
    const getDaysUntil = useCallback((date: Date) => {
        const today = new Date();
        return differenceInCalendarDays(date, today);
    }, []);

    // Get human-readable relative time
    const getRelativeTimeLabel = useCallback((date: Date) => {
        const daysUntil = getDaysUntil(date);

        if (daysUntil === 0) return "Today";
        if (daysUntil === 1) return "Tomorrow";
        if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`;
        if (daysUntil < 7) return `In ${daysUntil} days`;

        return format(date, 'MMM d');
    }, [getDaysUntil]);

    // Get task type color with enhanced colors for better visibility
    const getTaskTypeColor = useCallback((type: string) => {
        switch (type) {
            case "assignment": return "bg-blue-600 text-blue-50";
            case "project": return "bg-emerald-600 text-emerald-50";
            case "quiz": return "bg-amber-600 text-amber-50";
            default: return "bg-gray-600 text-gray-50";
        }
    }, []);

    // Get task badge color with enhanced colors
    const getTaskBadgeColor = useCallback((type: string) => {
        switch (type) {
            case "assignment": return "border-blue-200 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
            case "project": return "border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
            case "quiz": return "border-amber-200 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
            default: return "border-gray-200 bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800";
        }
    }, []);

    // Get task icon based on type
    const getTaskIcon = useCallback((type: string) => {
        switch (type) {
            case "assignment": return "📝";
            case "project": return "🚀";
            case "quiz": return "📊";
            default: return "📌";
        }
    }, []);

    // Format time from 24hr to 12hr format with AM/PM
    const formatTime = useCallback((time?: string) => {
        if (!time) return "";

        try {
            const [hours, minutes] = time.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return "";

            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;

            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (error) {
            return "";
        }
    }, []);

    // Get priority level based on due date
    const getTaskPriority = useCallback((date: Date) => {
        const daysUntil = getDaysUntil(date);

        if (daysUntil < 0) return "overdue";
        if (daysUntil === 0) return "today";
        if (daysUntil <= 2) return "urgent";
        if (daysUntil <= 5) return "soon";
        return "scheduled";
    }, [getDaysUntil]);

    // Get priority display info
    const getPriorityDisplay = useCallback((priority: string) => {
        switch (priority) {
            case "overdue":
                return { label: "Overdue", color: "text-red-600 dark:text-red-400" };
            case "today":
                return { label: "Due Today", color: "text-amber-600 dark:text-amber-400" };
            case "urgent":
                return { label: "Urgent", color: "text-orange-600 dark:text-orange-400" };
            case "soon":
                return { label: "Coming Soon", color: "text-blue-600 dark:text-blue-400" };
            default:
                return { label: "Scheduled", color: "text-green-600 dark:text-green-400" };
        }
    }, []);

    // Sort tasks by date for the upcoming tasks list (memoized)
    const sortedTasks = useMemo(() => {
        return [...localTasks]
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            // Group by priority as primary sort, then by date as secondary sort
            .sort((a, b) => {
                const priorityA = getTaskPriority(a.date);
                const priorityB = getTaskPriority(b.date);

                // Define priority order
                const priorityOrder = {
                    "overdue": 0,
                    "today": 1,
                    "urgent": 2,
                    "soon": 3,
                    "scheduled": 4
                };

                return (priorityOrder[priorityA as keyof typeof priorityOrder] -
                    priorityOrder[priorityB as keyof typeof priorityOrder]);
            });
    }, [localTasks, getTaskPriority]);

    // Get tasks for the selected date or all tasks if no date is selected
    const tasksToDisplay = useMemo(() => {
        if (!selectedDate) return sortedTasks.slice(0, 5);
        return localTasks.filter(task => selectedDate && isSameDay(task.date, selectedDate));
    }, [selectedDate, sortedTasks, localTasks]);

    // Get tasks for a specific date (memoized for each date)
    const getTasksForDate = useCallback((date: Date) => {
        return localTasks.filter(task => isSameDay(task.date, date));
    }, [localTasks]);

    // Handle day click to update selectedDate and open task creation modal for empty days
    const handleDateClick = (date: Date) => {
        setSelectedDate(date);

        // If the clicked day has no tasks, open the task creation modal immediately
        const tasksForClickedDay = getTasksForDate(date);
        if (tasksForClickedDay.length === 0) {
            setEditingTask(undefined);
            setIsTaskCreationModalOpen(true);
        }
    };

    // Handle adding a new task
    const handleAddTask = (taskData: any) => {
        const newTask: Task = {
            id: Math.floor(Math.random() * 10000), // Generate a random ID for demo
            title: taskData.title,
            date: taskData.date,
            type: taskData.type,
            dueTime: taskData.dueTime,
            description: taskData.description,
            completed: false
        };

        setLocalTasks(prev => [...prev, newTask]);
    };

    // Handle updating a task
    const handleUpdateTask = (id: number, taskData: any) => {
        setLocalTasks(prev =>
            prev.map(task =>
                task.id === id
                    ? {
                        ...task,
                        title: taskData.title,
                        type: taskData.type,
                        date: taskData.date,
                        dueTime: taskData.dueTime,
                        description: taskData.description
                    }
                    : task
            )
        );
    };

    // Handle deleting a task
    const handleDeleteTask = (id: number) => {
        setLocalTasks(prev => prev.filter(task => task.id !== id));
    };

    // Handle task completion toggle
    const handleCompleteTask = (id: number, completed: boolean) => {
        setLocalTasks(prev =>
            prev.map(task =>
                task.id === id
                    ? { ...task, completed }
                    : task
            )
        );
    };

    // Handle date selection from calendar picker
    const handleDateSelection = (date: Date | undefined) => {
        if (date) {
            // Find the week containing this date
            const weekStart = startOfWeek(date, { weekStartsOn: 0 });
            setCurrentWeekStart(weekStart);
        }
    };

    // Get the current month and year for the date picker
    const currentMonthYear = useMemo(() => {
        return `${format(currentWeekStart, 'MMMM yyyy')}`;
    }, [currentWeekStart]);

    return (
        <>
            <Card className={cn(
                "overflow-hidden shadow-md border animate-in fade-in-50 duration-300",
                "bg-gradient-to-b from-card to-card/95",
                className
            )}>
                <div className="p-4 flex flex-col items-center justify-center border-b bg-card/50 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10"></div>
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-primary/5 rounded-full blur-lg"></div>

                    <h3 className="font-medium text-base mb-2 flex items-center gap-2">
                        <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Your Learning Schedule
                        <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                    </h3>
                    <div className="flex items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1 bg-background/80 backdrop-blur-sm hover:bg-background"
                                >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {currentMonthYear}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    onSelect={handleDateSelection}
                                    initialFocus
                                    captionLayout="dropdown-buttons"
                                    fromYear={2025}
                                    toYear={2030}
                                />
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-muted/80 transition-all duration-200"
                            onClick={goToPreviousWeek}
                            aria-label="Previous week"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 hover:bg-muted/80 transition-all duration-200"
                            onClick={goToCurrentWeek}
                            disabled={isCurrentWeek}
                            aria-label="Today"
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-muted/80 transition-all duration-200"
                            onClick={goToNextWeek}
                            aria-label="Next week"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <CardContent className="p-3">
                    <div className="text-xs text-center font-medium text-muted-foreground mb-3">
                        {formatDateRange}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                        {/* Day headers */}
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                            <div key={i} className="text-center text-xs font-medium py-1">
                                {day}
                            </div>
                        ))}

                        {/* Calendar days */}
                        {weekDays.map((date, i) => {
                            const tasksForDay = getTasksForDate(date);
                            const hasTask = tasksForDay.length > 0;
                            const isToday = isDateToday(date);
                            const dayNumber = format(date, 'd');
                            const isWeekend = i === 0 || i === 6; // Sunday or Saturday

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleDateClick(date)}
                                    className={cn(
                                        "rounded-md flex flex-col items-center p-1.5 min-h-16 relative transition-all duration-200 ease-in-out cursor-pointer",
                                        isToday
                                            ? "bg-primary/15 ring-1 ring-primary/40 shadow-md"
                                            : selectedDate && isSameDay(date, selectedDate)
                                                ? "bg-secondary/70 ring-1 ring-primary/30 shadow-md" // Active state for selected date
                                                : hasTask
                                                    ? "bg-secondary/50 hover:bg-secondary/70 ring-1 ring-primary/20"
                                                    : isWeekend
                                                        ? "bg-muted/30 hover:bg-secondary/40"
                                                        : "hover:bg-secondary/40",
                                        "transform hover:scale-[1.03] hover:shadow-md",
                                        `animate-in fade-in-50 slide-in-from-bottom-1 duration-${300 + i * 50}`,
                                        hasTask && "bg-gradient-to-b from-secondary/60 to-secondary/40"
                                    )}
                                >
                                    {/* Day number with enhanced styling */}
                                    <div className={cn(
                                        "relative flex items-center justify-center",
                                        isToday && "animate-pulse-subtle"
                                    )}>
                                        <span className={cn(
                                            "text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full transition-colors",
                                            isToday
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : isWeekend
                                                    ? "text-muted-foreground"
                                                    : "text-foreground"
                                        )}>
                                            {dayNumber}
                                        </span>
                                        {isToday && (
                                            <span className="absolute -inset-0.5 rounded-full animate-ping bg-primary/20 opacity-75"></span>
                                        )}
                                    </div>

                                    {/* Task indicators - Enhanced for better visibility */}
                                    {hasTask ? (
                                        <div className="mt-1.5 flex flex-col w-full gap-1">
                                            {tasksForDay.slice(0, 2).map((task, index) => {
                                                const priority = getTaskPriority(task.date);
                                                const isPriority = priority === "overdue" || priority === "today";

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className={cn(
                                                            "px-1.5 py-0.5 text-[9px] rounded truncate w-full shadow-sm transition-all",
                                                            getTaskTypeColor(task.type),
                                                            isPriority ? "ring-1 ring-white/70" : "",
                                                            "hover:scale-105 hover:shadow-md",
                                                            `animate-in fade-in-50 slide-in-from-bottom-1 duration-${400 + index * 100}`
                                                        )}
                                                        title={`${task.title}${task.dueTime ? ` - Due: ${formatTime(task.dueTime)}` : ''}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span className="flex-shrink-0">{getTaskIcon(task.type)}</span>
                                                            <span className="truncate">{task.title.length > 8 ? `${task.title.substring(0, 6)}...` : task.title}</span>
                                                        </div>
                                                        {task.dueTime && (
                                                            <div className="text-[8px] font-medium text-white/90 mt-0.5 flex items-center">
                                                                <Clock className="h-2 w-2 mr-0.5 inline" />
                                                                {formatTime(task.dueTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {tasksForDay.length > 2 && (
                                                <div className="text-[9px] font-medium text-center text-foreground mt-0.5 bg-secondary/80 rounded px-1 py-0.5 shadow-sm animate-in fade-in-50 slide-in-from-bottom-1 duration-700">
                                                    +{tasksForDay.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-1.5 w-full h-6 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-muted-foreground">Click to add</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Task list - Enhanced with better styling and priority indicators */}
                    <div className="mt-5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Upcoming Tasks
                            </h4>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 px-2 flex items-center gap-1"
                                    onClick={() => {
                                        setSelectedDate(new Date());
                                        setEditingTask(undefined);
                                        setIsTaskCreationModalOpen(true);
                                    }}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Task
                                </Button>
                            </div>
                        </div>

                        {localTasks.length > 0 ? (
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                                {tasksToDisplay
                                    .map((task, idx) => {
                                        const priority = getTaskPriority(task.date);
                                        const { label: priorityLabel, color: priorityColor } = getPriorityDisplay(priority);

                                        return (
                                            <div
                                                key={task.id}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-muted/40 transition-all",
                                                    "hover:shadow-sm transform hover:translate-x-1 duration-200",
                                                    priority === "overdue" ? "border-red-200 dark:border-red-800" :
                                                        priority === "today" ? "border-amber-200 dark:border-amber-800" :
                                                            priority === "urgent" ? "border-orange-200 dark:border-orange-800" : "",
                                                    `animate-in fade-in-50 slide-in-from-left-1 duration-${300 + idx * 100}`
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs cursor-pointer",
                                                    task.completed
                                                        ? "bg-muted text-muted-foreground"
                                                        : task.type === "assignment"
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                                            : task.type === "project"
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                                                )}
                                                    onClick={() => handleCompleteTask(task.id, !task.completed)}
                                                    title={task.completed ? "Mark as incomplete" : "Mark as complete"}
                                                >
                                                    {task.completed ? "✓" : getTaskIcon(task.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-xs font-medium line-clamp-1",
                                                        task.completed ? "text-muted-foreground line-through" : "text-foreground"
                                                    )}>
                                                        {task.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {format(task.date, 'EEE, MMM d')}
                                                            <span className={cn("ml-1.5 font-medium", priorityColor)}>
                                                                ({getRelativeTimeLabel(task.date)})
                                                            </span>
                                                        </p>
                                                        {task.dueTime && (
                                                            <div className="flex items-center text-[10px] text-muted-foreground">
                                                                <Clock className="h-2.5 w-2.5 mr-0.5 inline" />
                                                                {formatTime(task.dueTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] px-1.5 py-0 h-4 font-medium",
                                                                getTaskBadgeColor(task.type)
                                                            )}
                                                        >
                                                            {task.type}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(task.id);
                                                            }}
                                                            title="Delete task"
                                                        >
                                                            <span className="text-[10px]">×</span>
                                                        </Button>
                                                    </div>

                                                    {priority !== "scheduled" && (
                                                        <span className={cn(
                                                            "text-[9px] font-medium",
                                                            priorityColor
                                                        )}>
                                                            {priorityLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="text-center py-4 space-y-2 animate-in fade-in-50 duration-500">
                                <p className="text-xs text-muted-foreground">No upcoming tasks</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 hover:bg-muted/80"
                                    onClick={() => {
                                        setSelectedDate(new Date());
                                        setIsTaskCreationModalOpen(true);
                                    }}
                                >
                                    Add your first task
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Task Detail Modal */}
            <TaskDetailModal
                isOpen={isTaskDetailModalOpen}
                onClose={() => setIsTaskDetailModalOpen(false)}
                selectedDate={selectedDate}
                tasks={localTasks}
                onEditTask={(task) => {
                    setEditingTask(task);
                    setIsTaskDetailModalOpen(false);
                    setIsTaskCreationModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                onCompleteTask={handleCompleteTask}
            />

            {/* Task Creation Modal */}
            <TaskCreationModal
                isOpen={isTaskCreationModalOpen}
                onClose={() => {
                    setIsTaskCreationModalOpen(false);
                    setEditingTask(undefined);
                }}
                onAddTask={handleAddTask}
                defaultDate={selectedDate || new Date()}
                editingTask={editingTask}
                onUpdateTask={handleUpdateTask}
            />
        </>
    )
}