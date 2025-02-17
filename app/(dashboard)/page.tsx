import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Plus,
  PlayCircle,
  BookOpen,
  Target,
  Award,
  BarChart2,
  Clock,
  Calendar,
  GraduationCap,
  ChevronRight
} from "lucide-react"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { CourseCard } from "@/components/dashboard/course-card"
import { LineChart } from "@/components/dashboard/line-chart"
import { useState } from "react"

const quickActions = [
  {
    title: "Create Course",
    desc: "Generate from YouTube content",
    icon: PlayCircle
  },
  {
    title: "Browse Courses",
    desc: "Explore learning paths",
    icon: BookOpen
  },
  {
    title: "Set Goals",
    desc: "Track your progress",
    icon: Target
  },
  {
    title: "Achievements",
    desc: "View your badges",
    icon: Award
  }
]

const stats = [
  {
    label: "Learning Hours",
    value: "32.5h",
    icon: Clock,
    change: { value: "2.1h", positive: true }
  },
  {
    label: "Courses",
    value: "5",
    icon: GraduationCap
  },
  {
    label: "Completion",
    value: "85%",
    icon: Target,
    change: { value: "5%", positive: true }
  },
  {
    label: "Achievements",
    value: "12",
    icon: Award
  }
]

const activeCourses = [
  {
    id: "1",
    title: "Advanced JavaScript: From Fundamentals to Full Stack Development",
    instructor: {
      name: "Sarah Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
    },
    progress: 75,
    duration: "2h left",
    totalLessons: 24,
    completedLessons: 18
  },
  {
    id: "2",
    title: "Machine Learning and AI: Practical Applications",
    instructor: {
      name: "Dr. Michael Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    progress: 45,
    duration: "4h left",
    totalLessons: 32,
    completedLessons: 14
  }
]

const events = [
  {
    id: "1",
    title: "JavaScript Assessment",
    time: "Today, 2:00 PM",
    type: "assessment"
  },
  {
    id: "2",
    title: "Machine Learning Workshop",
    time: "Tomorrow, 10:00 AM",
    type: "workshop"
  },
  {
    id: "3",
    title: "Project Submission",
    time: "Friday, 11:59 PM",
    type: "deadline"
  }
]

const generateActivityData = (days: number) => {
  const data = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      hours: Math.random() * 5 + 1
    })
  }
  
  return data
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("week")
  const activityData = generateActivityData(7)

  return (
    <div className="container mx-auto space-y-8 p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Alex</h1>
          <p className="text-muted-foreground">
            Track your progress and continue learning
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
          <Button variant="outline" size="icon" className="relative shadow">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              3
            </span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <QuickActionCard key={action.title} {...action} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-7">
        <div className="space-y-8 lg:col-span-4">
          {/* Statistics */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Learning Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <StatsCard key={stat.label} {...stat} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Courses */}
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
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
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle>Learning Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hours spent learning
                </p>
              </div>
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
              >
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
        <div className="space-y-8 lg:col-span-3">
          {/* Schedule */}
          <Card className="border-2">
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
                        className={`h-2 w-2 rounded-full ${
                          event.type === "assessment"
                            ? "bg-orange-500"
                            : event.type === "workshop"
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-none">
                          {event.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.time}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Progress Overview</CardTitle>
                <Button variant="ghost" size="icon">
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Course Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground">
                      +5% from last week
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Weekly Goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8.5h</div>
                    <p className="text-xs text-muted-foreground">
                      2.5h remaining
                    </p>
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