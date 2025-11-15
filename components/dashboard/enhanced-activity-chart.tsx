"use client"

import React, { useMemo, useState } from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
    Area,
    ComposedChart,
    Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { ArrowUp, ArrowDown, TrendingUp, Activity, Calendar, Clock } from "lucide-react"

// Enhanced type definitions for better type safety
interface ActivityData {
    name: string
    hours: number
    streak?: number
}

interface EnhancedActivityChartProps {
    className?: string
    data: ActivityData[]
    title?: string
    description?: string
    showAverage?: boolean
    defaultView?: "weekly" | "monthly"
}

export function EnhancedActivityChart({
    className,
    data,
    title = "Activity Overview",
    description = "Your learning activity over time",
    showAverage = true,
    defaultView = "weekly",
}: EnhancedActivityChartProps) {
    const { theme } = useTheme()
    const isDark = theme === "dark"
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    // Add state to track the active tab view
    const [activeView, setActiveView] = useState<"weekly" | "monthly">(defaultView)

    // Calculate weekly data (last 7 days) - memoized
    const weeklyData = useMemo(() => {
        return data.slice(Math.max(0, data.length - 7));
    }, [data]);

    // Calculate monthly data (last 30 days, or all if less than 30) - memoized
    const monthlyData = useMemo(() => {
        return data.slice(Math.max(0, data.length - 30));
    }, [data]);

    // Helper function for average calculation
    const calculateAverage = (dataArray: ActivityData[]) => {
        if (dataArray.length === 0) return 0
        const sum = dataArray.reduce((acc, curr) => acc + curr.hours, 0)
        return Math.round((sum / dataArray.length) * 10) / 10
    }

    // Helper function for total calculation
    const calculateTotal = (dataArray: ActivityData[]) => {
        return dataArray.reduce((acc, curr) => acc + curr.hours, 0)
    }

    // Calculate trend percentage
    const calculateTrend = (dataArray: ActivityData[]) => {
        if (dataArray.length < 2) return 0;
        const firstHalf = dataArray.slice(0, Math.floor(dataArray.length / 2));
        const secondHalf = dataArray.slice(Math.floor(dataArray.length / 2));

        const firstHalfAvg = calculateAverage(firstHalf);
        const secondHalfAvg = calculateAverage(secondHalf);

        if (firstHalfAvg === 0) return secondHalfAvg > 0 ? 100 : 0;

        const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        return Math.round(percentChange);
    }

    // Memoize derived values to prevent recalculation
    const {
        weeklyAverage,
        monthlyAverage,
        weeklyTotal,
        monthlyTotal,
        currentStreak,
        weeklyTrend,
        monthlyTrend,
        maxHours,
    } = useMemo(() => {
        return {
            weeklyAverage: calculateAverage(weeklyData),
            monthlyAverage: calculateAverage(monthlyData),
            weeklyTotal: calculateTotal(weeklyData),
            monthlyTotal: calculateTotal(monthlyData),
            currentStreak: data[data.length - 1]?.streak || 0,
            weeklyTrend: calculateTrend(weeklyData),
            monthlyTrend: calculateTrend(monthlyData),
            maxHours: Math.max(...data.map(item => item.hours), 0.1), // Ensure non-zero for scaling
        };
    }, [weeklyData, monthlyData, data]);

    // Calculate goal progress using the now-defined weeklyTotal
    const goalHours = 10; // Example goal: 10 hours per week
    const goalProgress = Math.min(Math.round((weeklyTotal / goalHours) * 100), 100);

    // Enhanced tooltip component with improved styling
    const CustomTooltip = useMemo(() => {
        return ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                const hours = payload[0].value;
                const percentage = Math.round((hours / maxHours) * 100);

                return (
                    <div className="custom-tooltip bg-background border border-border rounded-lg p-3 shadow-md text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{label}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <p className="text-primary font-semibold">{hours} hours</p>
                            </div>
                            {percentage > 0 && (
                                <div className="flex items-center space-x-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        {percentage}% of max activity
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
            return null
        }
    }, [maxHours]);

    // Color definitions with improved contrast - memoized to prevent recreating on every render
    const colors = useMemo(() => {
        const barColors = {
            light: {
                primary: "#2563eb", // More vibrant blue
                primaryGradientStart: "rgba(37, 99, 235, 1)",
                primaryGradientEnd: "rgba(59, 130, 246, 0.6)",
                secondary: "rgba(37, 99, 235, 0.7)", // Translucent primary
                reference: "#6b7280", // Gray for reference line
                grid: "#e5e7eb", // Light gray for grid
                increase: "#10b981", // Green for positive trends
                decrease: "#ef4444", // Red for negative trends
                areaFill: "rgba(37, 99, 235, 0.1)", // Very light blue for area
            },
            dark: {
                primary: "#3b82f6", // Brighter blue for dark mode
                primaryGradientStart: "rgba(59, 130, 246, 1)",
                primaryGradientEnd: "rgba(96, 165, 250, 0.6)",
                secondary: "rgba(96, 165, 250, 0.8)", // Translucent primary
                reference: "#9ca3af", // Lighter gray for reference line in dark mode
                grid: "#374151", // Dark gray for grid
                increase: "#10b981", // Green for positive trends
                decrease: "#ef4444", // Red for negative trends
                areaFill: "rgba(59, 130, 246, 0.1)", // Very light blue for area
            }
        };

        return isDark ? barColors.dark : barColors.light;
    }, [isDark]);

    // Define gradient for bars
    const getBarGradient = (id: string, colors: any) => (
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primaryGradientStart} />
            <stop offset="100%" stopColor={colors.primaryGradientEnd} />
        </linearGradient>
    );

    // Handle mouse events for bar highlighting
    const handleMouseEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const handleMouseLeave = () => {
        setActiveIndex(null);
    };

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveView(value as "weekly" | "monthly");
    };

    return (
        <Card className={cn("shadow-md rounded-xl overflow-hidden border transition-all duration-200", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-primary/10 py-1 flex items-center gap-1 shadow-sm border-primary/20">
                            <span className="font-bold text-primary text-sm">{goalProgress}%</span>
                            <span className="ml-1 text-muted-foreground">goal progress</span>
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2 pb-0">
                <Tabs defaultValue={defaultView} className="w-full" onValueChange={handleTabChange}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-3">
                        <TabsList className="grid w-44 grid-cols-2">
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="text-sm px-2 py-1 rounded-md bg-background border shadow-sm">
                                    <span className="text-muted-foreground mr-1">Total:</span>
                                    <span className="font-medium tabular-nums">
                                        {activeView === "weekly" ? weeklyTotal : monthlyTotal} hrs
                                    </span>
                                </div>

                                {showAverage && (
                                    <div className="text-sm px-2 py-1 rounded-md bg-background border shadow-sm">
                                        <span className="text-muted-foreground mr-1">Avg:</span>
                                        <span className="font-medium tabular-nums">
                                            {activeView === "weekly" ? weeklyAverage : monthlyAverage} hrs/day
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center">
                                {/* Trend indicator */}
                                <div className={cn(
                                    "text-xs px-2 py-1 rounded-full flex items-center gap-1",
                                    activeView === "weekly"
                                        ? (weeklyTrend > 0 ? "bg-green-100 text-green-700" : weeklyTrend < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")
                                        : (monthlyTrend > 0 ? "bg-green-100 text-green-700" : monthlyTrend < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"),
                                    isDark && "bg-opacity-20"
                                )}>
                                    {activeView === "weekly" ? (
                                        weeklyTrend > 0 ? (
                                            <>
                                                <ArrowUp className="h-3 w-3" />
                                                <span>{weeklyTrend}%</span>
                                            </>
                                        ) : weeklyTrend < 0 ? (
                                            <>
                                                <ArrowDown className="h-3 w-3" />
                                                <span>{Math.abs(weeklyTrend)}%</span>
                                            </>
                                        ) : (
                                            <span>No change</span>
                                        )
                                    ) : (
                                        monthlyTrend > 0 ? (
                                            <>
                                                <ArrowUp className="h-3 w-3" />
                                                <span>{monthlyTrend}%</span>
                                            </>
                                        ) : monthlyTrend < 0 ? (
                                            <>
                                                <ArrowDown className="h-3 w-3" />
                                                <span>{Math.abs(monthlyTrend)}%</span>
                                            </>
                                        ) : (
                                            <span>No change</span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="weekly" className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={weeklyData}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 5,
                                    bottom: 25,
                                }}
                                onMouseLeave={handleMouseLeave}
                            >
                                <defs>
                                    {getBarGradient("weeklyBarGradient", colors)}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: colors.grid }}
                                    style={{ fontSize: "12px" }}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    style={{ fontSize: "12px" }}
                                    width={30}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.15 }} />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    fill={colors.areaFill}
                                    stroke="none"
                                    animationDuration={1000}
                                />
                                {showAverage && (
                                    <ReferenceLine
                                        y={weeklyAverage}
                                        stroke={colors.reference}
                                        strokeDasharray="3 3"
                                        label={{
                                            value: "Avg",
                                            position: "left",
                                            fill: colors.reference,
                                            fontSize: 12,
                                        }}
                                    />
                                )}
                                <Bar
                                    dataKey="hours"
                                    radius={[4, 4, 0, 0]}
                                    barSize={28}
                                    animationDuration={1000}
                                    onMouseEnter={handleMouseEnter}
                                >
                                    {weeklyData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#weeklyBarGradient)`}
                                            opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                                            cursor="pointer"
                                        />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="monthly" className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={monthlyData}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 5,
                                    bottom: 25,
                                }}
                                onMouseLeave={handleMouseLeave}
                            >
                                <defs>
                                    {getBarGradient("monthlyBarGradient", colors)}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: colors.grid }}
                                    style={{ fontSize: "12px" }}
                                    dy={10}
                                    interval={monthlyData.length > 15 ? 1 : 0}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    style={{ fontSize: "12px" }}
                                    width={30}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.15 }} />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    fill={colors.areaFill}
                                    stroke="none"
                                    animationDuration={1000}
                                />
                                {showAverage && (
                                    <ReferenceLine
                                        y={monthlyAverage}
                                        stroke={colors.reference}
                                        strokeDasharray="3 3"
                                        label={{
                                            value: "Avg",
                                            position: "left",
                                            fill: colors.reference,
                                            fontSize: 12,
                                        }}
                                    />
                                )}
                                <Bar
                                    dataKey="hours"
                                    radius={[4, 4, 0, 0]}
                                    barSize={monthlyData.length > 15 ? 16 : 28}
                                    animationDuration={1000}
                                    onMouseEnter={handleMouseEnter}
                                >
                                    {monthlyData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#monthlyBarGradient)`}
                                            opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                                            cursor="pointer"
                                        />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}