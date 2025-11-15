"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Clock,
    BookOpen,
    Activity,
    Award,
    Zap,
    BarChart3,
    TrendingUp,
    Calendar,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subDays, differenceInCalendarDays } from "date-fns"

interface StudyActivityMetrics {
    streak: number
    totalHoursStudied: number
    totalCoursesCompleted: number
    totalLessonsCompleted: number
    activeDays: number
    activeDaysThisWeek: number
    topCourseTopic?: string
    lastActiveDate?: Date
    currentLevel?: number
    progressToNextLevel?: number
}

interface StudyActivitySummaryProps {
    metrics: StudyActivityMetrics
    className?: string
}

export function StudyActivitySummary({ metrics, className }: StudyActivitySummaryProps) {
    const [mounted, setMounted] = useState(false)

    // Only run animations after component has mounted (for SSR compatibility)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Format last active date with relative time
    const formatLastActive = () => {
        if (!metrics.lastActiveDate) return "Not started yet";

        const today = new Date();
        const daysAgo = differenceInCalendarDays(today, metrics.lastActiveDate);

        if (daysAgo === 0) return "Today";
        if (daysAgo === 1) return "Yesterday";
        if (daysAgo < 7) return `${daysAgo} days ago`;

        return format(metrics.lastActiveDate, 'MMM d, yyyy');
    }

    // Calculate streak health
    const getStreakHealth = () => {
        if (metrics.streak === 0) return "inactive";
        if (metrics.streak < 3) return "starting";
        if (metrics.streak < 7) return "building";
        if (metrics.streak < 14) return "strong";
        return "exceptional";
    }

    // Get streak health display info
    const getStreakDisplay = (health: string) => {
        switch (health) {
            case "exceptional":
                return { label: "Exceptional", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950" };
            case "strong":
                return { label: "Strong", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950" };
            case "building":
                return { label: "Building", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" };
            case "starting":
                return { label: "Just Starting", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" };
            default:
                return { label: "Inactive", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-950" };
        }
    }

    // Calculate activity trend
    const getActivityTrend = () => {
        if (metrics.activeDaysThisWeek === 0) return "inactive";
        if (metrics.activeDaysThisWeek <= 2) return "low";
        if (metrics.activeDaysThisWeek <= 4) return "moderate";
        return "high";
    }

    // Get activity trend display info
    const getActivityDisplay = (trend: string) => {
        switch (trend) {
            case "high":
                return {
                    label: "High Activity",
                    color: "text-green-600 dark:text-green-400",
                    bg: "bg-green-50 dark:bg-green-950",
                    icon: <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                };
            case "moderate":
                return {
                    label: "Moderate",
                    color: "text-blue-600 dark:text-blue-400",
                    bg: "bg-blue-50 dark:bg-blue-950",
                    icon: <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                };
            case "low":
                return {
                    label: "Low Activity",
                    color: "text-amber-600 dark:text-amber-400",
                    bg: "bg-amber-50 dark:bg-amber-950",
                    icon: <Activity className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                };
            default:
                return {
                    label: "Inactive",
                    color: "text-gray-600 dark:text-gray-400",
                    bg: "bg-gray-50 dark:bg-gray-950",
                    icon: <Activity className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 opacity-50" />
                };
        }
    }

    // Generate random data for recent activity (for demonstration)
    const generateLastSevenDaysActivity = () => {
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const value = metrics.activeDaysThisWeek > 0
                ? Math.random() > 0.5 || (i === 0 && metrics.lastActiveDate && differenceInCalendarDays(today, metrics.lastActiveDate) === 0)
                    ? Math.floor(Math.random() * 3) + 1
                    : 0
                : 0;

            data.push({
                date: format(date, 'd'),
                day: format(date, 'EEE'),
                value
            });
        }

        return data;
    }

    // Class function to get activity bar height class
    const getActivityBarHeightClass = (value: number) => {
        if (value <= 0) return "h-[10%]";
        const heightPercent = (value / 3) * 100;
        // Using utility classes for fixed heights
        if (heightPercent <= 25) return "h-1/4";
        if (heightPercent <= 50) return "h-1/2";
        if (heightPercent <= 75) return "h-3/4";
        return "h-full";
    };

    // Class function to get progress bar width class
    const getProgressWidthClass = (progressPercent: number) => {
        // Using w-{percent} utility classes for percentage-based widths
        return `w-[${progressPercent}%]`;
    };

    const recentActivity = generateLastSevenDaysActivity();
    const streakHealth = getStreakHealth();
    const streakDisplay = getStreakDisplay(streakHealth);
    const activityTrend = getActivityTrend();
    const activityDisplay = getActivityDisplay(activityTrend);

    return (
        <Card className={cn(
            "overflow-hidden shadow-md border",
            mounted ? "animate-in fade-in-50 duration-500" : "opacity-0",
            className
        )}>
            <div className="p-4 flex items-center justify-between border-b bg-card/50">
                <h3 className="font-medium text-sm flex items-center gap-1.5">
                    <span className="inline-block rounded-full bg-primary/15 p-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    </span>
                    Study Activity
                </h3>
                <Badge
                    variant="outline"
                    className={cn(
                        "text-xs px-2.5 py-0.5",
                        streakDisplay.bg,
                        streakDisplay.color,
                        "border-0"
                    )}
                >
                    {metrics.streak > 0
                        ? `${metrics.streak} Day Streak`
                        : "No Active Streak"}
                </Badge>
            </div>

            <CardContent className="p-4 pb-2">
                <div className="grid grid-cols-3 gap-4">
                    {/* Total Study Time */}
                    <div className={cn(
                        "rounded-md p-3 flex flex-col items-center justify-center text-center bg-blue-50 dark:bg-blue-950/50",
                        mounted ? "animate-in fade-in-50 slide-in-from-bottom-2 duration-300" : ""
                    )}>
                        <div className="text-blue-600 dark:text-blue-400 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900 mb-1.5">
                            <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {metrics.totalHoursStudied}h
                        </span>
                        <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium">
                            Total Hours
                        </span>
                    </div>

                    {/* Completed Courses */}
                    <div className={cn(
                        "rounded-md p-3 flex flex-col items-center justify-center text-center bg-emerald-50 dark:bg-emerald-950/50",
                        mounted ? "animate-in fade-in-50 slide-in-from-bottom-2 duration-400" : ""
                    )}>
                        <div className="text-emerald-600 dark:text-emerald-400 p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 mb-1.5">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {metrics.totalCoursesCompleted}
                        </span>
                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                            Courses Done
                        </span>
                    </div>

                    {/* Completed Lessons */}
                    <div className={cn(
                        "rounded-md p-3 flex flex-col items-center justify-center text-center bg-amber-50 dark:bg-amber-950/50",
                        mounted ? "animate-in fade-in-50 slide-in-from-bottom-2 duration-500" : ""
                    )}>
                        <div className="text-amber-600 dark:text-amber-400 p-1.5 rounded-full bg-amber-100 dark:bg-amber-900 mb-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                            {metrics.totalLessonsCompleted}
                        </span>
                        <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium">
                            Lessons Done
                        </span>
                    </div>
                </div>

                {/* Activity Visualization */}
                <div className="mt-4 rounded-md border p-3">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-medium flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Weekly Activity</span>
                        </h4>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">
                                Last active: {formatLastActive()}
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] px-1.5 py-0 h-4",
                                    activityDisplay.bg,
                                    activityDisplay.color,
                                    "border-0 flex items-center gap-1"
                                )}
                            >
                                {activityDisplay.icon}
                                <span>{activityDisplay.label}</span>
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-16 mt-1">
                        {recentActivity.map((day, i) => (
                            <TooltipProvider key={i} delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center gap-1 flex-1">
                                            <div
                                                className={cn(
                                                    "w-5 rounded-t-sm transition-all duration-500",
                                                    day.value > 0
                                                        ? "bg-primary"
                                                        : "bg-muted",
                                                    mounted ? "animate-in fade-in-50 slide-in-from-bottom-3" : "",
                                                    `duration-${500 + i * 100}`,
                                                    getActivityBarHeightClass(day.value)
                                                )}
                                            ></div>
                                            <span className="text-[9px] text-muted-foreground font-medium">
                                                {day.day.substring(0, 1)}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs p-2">
                                        <p>{day.day}, {day.value > 0 ? `${day.value} hours` : 'No activity'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>

                {/* Level Status */}
                {metrics.currentLevel && metrics.progressToNextLevel !== undefined && (
                    <div className={cn(
                        "mt-4 rounded-md border p-3 flex items-center gap-3",
                        mounted ? "animate-in fade-in-50 slide-in-from-bottom-2 duration-700" : ""
                    )}>
                        <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
                            <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs font-medium">
                                <span>Level {metrics.currentLevel}</span>
                                <span className="text-muted-foreground">{metrics.progressToNextLevel}% to Level {metrics.currentLevel + 1}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full bg-primary rounded-full transition-all duration-1000",
                                        getProgressWidthClass(metrics.progressToNextLevel)
                                    )}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Interest Tag */}
                {metrics.topCourseTopic && (
                    <div className={cn(
                        "mt-4 text-xs text-center",
                        mounted ? "animate-in fade-in-50 duration-1000" : ""
                    )}>
                        <span className="text-muted-foreground">Top interest: </span>
                        <Badge variant="secondary" className="ml-1.5">
                            {metrics.topCourseTopic}
                        </Badge>
                    </div>
                )}
            </CardContent>

            <CardFooter className="px-4 py-3 flex justify-between border-t bg-card/50">
                <Button variant="ghost" size="sm" className="text-xs">
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    View Activities
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                    Detailed Stats
                </Button>
            </CardFooter>
        </Card>
    )
}