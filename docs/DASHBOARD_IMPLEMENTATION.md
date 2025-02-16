# Dashboard Implementation with shadcn

## Overview

The dashboard provides a comprehensive overview of the user's learning progress, activities, and upcoming events using shadcn components.

## Key Components Used

- Card
- Button
- Progress
- ScrollArea
- Select
- Badge
- Avatar
- Separator

## Implementation

```tsx
// app/(dashboard)/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Bell,
  Calendar,
  Clock,
  Target,
  Award,
  BarChart2,
  PlayCircle,
  Bookmark,
  FileText,
  ChevronRight,
} from "lucide-react"
import { LineChart } from "./components/line-chart"
import { StatsCard } from "./components/stats-card"
import { QuickActionCard } from "./components/quick-action-card"
import { CourseCard } from "./components/course-card"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("week")

  return (
    <div className="container space-y-8 py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">
            Track your progress and continue learning
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              3
            </span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <QuickActionCard key={action.title} {...action} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-7">
        <div className="col-span-4 space-y-8">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <StatsCard key={stat.label} {...stat} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Courses</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your ongoing learning journey
                </p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {activeCourses.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Graph */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Learning Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hours spent learning
                </p>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <LineChart data={activityData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-3 space-y-8">
          {/* Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Schedule</CardTitle>
                <Button variant="ghost" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center space-x-4 rounded-lg border p-4"
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          event.type === "assessment" && "bg-orange-500",
                          event.type === "workshop" && "bg-blue-500",
                          event.type === "deadline" && "bg-red-500"
                        )}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-none">
                          {event.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.time}
                        </p>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Assignment Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assignments</CardTitle>
                <Button variant="ghost" size="icon">
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall Progress
                  </span>
                  <span>12/62</span>
                </div>
                <Progress value={(12 / 62) * 100} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Due This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

## Components

### Quick Action Card
```tsx
// components/quick-action-card.tsx
interface QuickActionCardProps {
  title: string
  desc: string
  icon: LucideIcon
}

export function QuickActionCard({ title, desc, icon: Icon }: QuickActionCardProps) {
  return (
    <Card className="transition-all hover:border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
```

### Stats Card
```tsx
// components/stats-card.tsx
interface StatsCardProps {
  label: string
  value: string
  icon: LucideIcon
}

export function StatsCard({ label, value, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
    </div>
  )
}
```

## Features

1. **Dashboard Overview**
   - Welcome header with notifications
   - Quick action cards
   - Learning statistics
   - Active courses

2. **Activity Tracking**
   - Learning hours graph
   - Progress indicators
   - Assignment tracking
   - Schedule management

3. **Visual Components**
   - Progress bars
   - Charts and graphs
   - Status badges
   - Interactive cards

4. **Responsive Layout**
   - Grid-based organization
   - Sidebar integration
   - Mobile adaptability
   - Consistent spacing

This implementation provides a comprehensive dashboard using shadcn components while maintaining a clean and professional appearance.