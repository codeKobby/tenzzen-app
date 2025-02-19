"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  GraduationCap,
  Target,
  Award,
  BookOpen,
  Star,
  FileText,
  TrendingUp,
  TrendingDown,
  PlayCircle,
  BrainCircuit,
  Plus,
  ChevronRight,
  Youtube,
  Sparkles,
  Timer,
  ListChecks,
  Code2
} from "lucide-react"
import { useGreeting } from "@/hooks/use-greeting"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { LineChart } from "@/components/dashboard/line-chart"

type StatChange = {
  value: string;
  type: "increase" | "decrease";
  showTrend?: boolean;
}

type LearningStatItem = {
  label: string;
  value: string;
  icon: any;
  change: StatChange;
}

const learningStats: LearningStatItem[] = [
  {
    label: "Learning Hours",
    value: "32.5h",
    icon: Clock,
    change: { value: "+2.1h", type: "increase" }
  },
  {
    label: "Active Courses",
    value: "5",
    icon: GraduationCap,
    change: { value: "+1", type: "increase" }
  },
  {
    label: "Avg. Progress",
    value: "85%",
    icon: Target,
    change: { value: "5%", type: "increase", showTrend: true }
  },
  {
    label: "Tasks Done",
    value: "12",
    icon: ListChecks,
    change: { value: "+2", type: "increase" }
  }
]

const inProgressCourses = [
  {
    id: 1,
    title: "Advanced Machine Learning",
    progress: 75,
    totalLessons: 48,
    completedLessons: 36,
    lastAccessed: "2 hours ago",
    thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    title: "Full-Stack Web Development",
    progress: 45,
    totalLessons: 64,
    completedLessons: 29,
    lastAccessed: "Yesterday",
    thumbnail: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&auto=format&fit=crop&q=60"
  }
]

const recentlyCreatedCourses = [
  {
    id: 3,
    title: "Introduction to Python Programming",
    source: "freeCodeCamp",
    duration: "8h 45m",
    lessons: 24,
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    title: "UI/UX Design Fundamentals",
    source: "Figma YouTube Channel",
    duration: "12h 30m",
    lessons: 36,
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60"
  }
]

type Task = {
  id: number
  type: "assignment" | "project" | "quiz"
  title: string
  course: string
  deadline: string
  status: "in-progress" | "not-started"
}

const upcomingTasks: Task[] = [
  {
    id: 1,
    type: "assignment",
    title: "Advanced Data Structures",
    course: "Full-Stack Web Development",
    deadline: "Tomorrow, 10:00 AM",
    status: "not-started"
  },
  {
    id: 2,
    type: "quiz",
    title: "Neural Networks Basics",
    course: "Advanced Machine Learning",
    deadline: "Thursday, 2:00 PM",
    status: "in-progress"
  },
  {
    id: 3,
    type: "project",
    title: "JavaScript Closures Quiz",
    course: "Advanced JavaScript Concepts",
    deadline: "Today, 6:00 PM",
    status: "not-started"
  }
]

export default function DashboardPage() {
  const greeting = useGreeting()
  const [timeRange] = useState("week")
  const [streak] = useState({
    current: 12,
    longest: 30,
    today: {
      minutes: 45,
      tasks: 2
    }
  })
  const activityData = [
    { date: "Mon", hours: 2.5 },
    { date: "Tue", hours: 3.2 },
    { date: "Wed", hours: 4.1 },
    { date: "Thu", hours: 2.8 },
    { date: "Fri", hours: 3.9 },
    { date: "Sat", hours: 1.5 },
    { date: "Sun", hours: 2.2 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full space-y-4 p-3 sm:p-4 lg:p-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/90 p-4 sm:p-6 shadow-xl">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.05)_15%,transparent_100%)] pointer-events-none"
            style={{ backgroundSize: '200% 100%', animation: 'shine 8s linear infinite' }}
          />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Greeting */}
              <div className="flex-1 flex items-center">
                <h1 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl lg:text-4xl">
                  {greeting} <span className="text-xl">👋</span> <span className="text-white">Alex</span>
                </h1>
              </div>
              
              {/* Streak and Buttons Stack */}
              <div className="flex flex-col gap-4 flex-1">
                {/* Streak Card */}
                <div className="rounded-lg bg-white/10 p-3.5 backdrop-blur-[2px] shadow-sm">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">
                        {streak.current}
                      </span>
                      <div className="flex flex-col justify-between">
                        <span className="text-sm text-primary-foreground/90">day streak</span>
                        <p className="text-[11px] text-primary-foreground/80 flex items-center gap-1.5">
                          Best: {streak.longest} days
                          {streak.current >= streak.longest && (
                            <span className="text-xs animate-pulse">
                              🏆
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-lg">
                        {streak.current >= 30 ? '🔥' :
                        streak.current >= 14 ? '💪' :
                        streak.current >= 7 ? '✨' : '🎯'}
                      </span>
                    </div>
                    {/* Right side */}
                    <div className="flex flex-col justify-between items-end">
                      <div className="flex flex-col gap-1.5 text-xs text-primary-foreground/90">
                        <div className="flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5" />
                          <span>45m today</span>
                          <span className="ml-1 text-xs">⭐</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ListChecks className="h-3.5 w-3.5" />
                          <span>2 tasks done</span>
                          <span className="ml-1 text-xs">✅</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-10 gap-2 px-4 bg-white/90 hover:bg-white text-primary hover:text-primary/90 shadow-lg"
                  >
                    <Youtube className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Import Video</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-10 gap-2 px-4 bg-white/90 hover:bg-white text-primary hover:text-primary/90 shadow-lg"
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span className="font-medium">AI Generate</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {learningStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-primary-foreground/10 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="rounded-lg bg-primary-foreground/10 p-2 shrink-0">
                    <stat.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary-foreground/70 truncate">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary-foreground sm:text-lg">
                        {stat.value}
                      </span>
                      {stat.change && (
                        <span className={`text-xs font-medium flex items-center gap-1 px-1.5 py-0.5 rounded-full
                          ${stat.change.type === "increase" 
                            ? "text-emerald-400 bg-emerald-400/10" 
                            : "text-red-400 bg-red-400/10"}`}
                        >
                          {stat.change.value}
                          {stat.change.showTrend ? (
                            <span className="ml-0.5">
                              {stat.change.type === "increase" 
                                ? <TrendingUp className="h-3 w-3" />
                                : <TrendingDown className="h-3 w-3" />}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary-foreground opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/3 translate-y-1/3 rounded-full bg-primary-foreground opacity-10 blur-3xl" />
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-4 md:col-span-2">
            {/* Active Courses */}
            <Card className="relative overflow-hidden">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 bg-primary/5 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <BookOpen className="h-5 w-5" />
                  Active YouTube Courses
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                {inProgressCourses.map((course) => (
                  <div key={course.id} className="group rounded-lg border bg-card p-3 hover:border-primary/50 transition-all">
                    <div className="flex gap-3">
                      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-40">
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] transition-opacity group-hover:opacity-0" />
                        {course.thumbnail && (
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            className="object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="h-8 w-8 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-medium leading-snug tracking-tight group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Last accessed {course.lastAccessed}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {course.completedLessons}/{course.totalLessons} lessons
                            </span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity Graph */}
            <Card className="relative overflow-hidden">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 bg-primary/5 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <Target className="h-5 w-5" />
                    Learning Activity
                  </CardTitle>
                  <Tabs defaultValue="week" className="space-y-0">
                    <TabsList className="grid h-7 w-[180px] grid-cols-3 p-1">
                      <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                      <TabsTrigger value="year" className="text-xs">Year</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-[250px]">
                  <LineChart data={activityData} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 bg-primary/5 rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <ListChecks className="h-5 w-5" />
                Tasks & Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              {upcomingTasks.map((task) => {
                const Icon = task.type === 'project' ? Code2 :
                  task.type === 'quiz' ? Target : ListChecks

                return (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 rounded-lg border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {task.course}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {task.deadline}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${task.status === 'in-progress'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                          }`}>
                          {task.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
