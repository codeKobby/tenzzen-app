"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  GraduationCap,
  Target,
  Award,
  BookOpen,
  Star,
  FileText,
  PlayCircle,
  BrainCircuit,
  Plus,
  ChevronRight,
  Youtube,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useGreeting } from "@/hooks/use-greeting"
import { LineChart } from "@/components/dashboard/line-chart"

const learningStats = [
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
    change: { value: "+5%", type: "increase" }
  },
  {
    label: "Achievements",
    value: "12",
    icon: Award,
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

const upcomingLessons = [
  {
    id: 1,
    title: "Advanced Data Structures",
    course: "Full-Stack Web Development",
    time: "Tomorrow, 10:00 AM",
    duration: "45m"
  },
  {
    id: 2,
    title: "Neural Networks Basics",
    course: "Advanced Machine Learning",
    time: "Thursday, 2:00 PM",
    duration: "1h"
  }
]

export default function DashboardPage() {
  const greeting = useGreeting()
  const [timeRange, setTimeRange] = useState("week")
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
      <div className="mx-auto max-w-[1500px] space-y-4 p-3 sm:p-4 lg:p-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-4 sm:p-6">
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-primary-foreground sm:text-xl lg:text-2xl">
                {greeting}, Alex
              </h1>
              <p className="text-sm text-primary-foreground/90 sm:text-base">
                Transform YouTube content into structured learning
              </p>
              <div className="mt-3 rounded-lg bg-primary-foreground/10 p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary-foreground">12</span>
                      <span className="text-sm text-primary-foreground/70">day streak</span>
                    </div>
                    <p className="mt-1 text-xs text-primary-foreground/70">
                      Longest: 30 days
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-primary-foreground/90">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      45m today
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      2 tasks done
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button 
                variant="secondary"
                size="sm" 
                className="gap-2"
              >
                <Youtube className="h-4 w-4" />
                Import from YouTube
              </Button>
              <Button 
                variant="secondary"
                size="sm" 
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI Course Generation
              </Button>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {learningStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-primary-foreground/10 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-foreground/10 p-2">
                    <stat.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-primary-foreground/70">
                      {stat.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary-foreground sm:text-lg">
                        {stat.value}
                      </span>
                      {stat.change && (
                        <span className="text-xs font-medium text-primary-foreground/90">
                          {stat.change.value}
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

        <div className="grid gap-4 md:grid-cols-3">
          {/* Current Progress */}
          <div className="space-y-4 md:col-span-2">
            <Card className="relative overflow-hidden">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 bg-primary/5 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <BookOpen className="h-5 w-5" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                {inProgressCourses.map((course) => (
                  <div 
                    key={course.id}
                    className="group rounded-lg border bg-card p-3 hover:border-primary/50 transition-all"
                  >
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

        <div className="grid gap-4 lg:grid-cols-6">
          {/* Recently Created Courses */}
          <Card className="relative overflow-hidden lg:col-span-4">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 bg-primary/5 rounded-full blur-3xl" />
            <CardHeader className="relative z-10 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <BrainCircuit className="h-5 w-5" />
                  Recently Created Courses
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link href="/courses" className="gap-1">
                    View all courses
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-4 pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                {recentlyCreatedCourses.map((course) => (
                  <div 
                    key={course.id}
                    className="group relative overflow-hidden rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="aspect-video relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
            <BookOpen className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/20" />
          </div>
          {course.thumbnail && (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="absolute inset-0 object-cover"
            />
          )}
                      <Link
                        href={`/courses/${course.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-primary/0 transition-colors group-hover:bg-primary/20"
                      >
                        <PlayCircle className="h-12 w-12 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <div className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 backdrop-blur-sm">
                        <p className="text-xs font-medium">{course.source}</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold leading-none tracking-tight">
                        {course.title}
                      </h3>
                      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {course.lessons} lessons
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-primary" />
                          {course.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Lessons */}
          <Card className="relative overflow-hidden lg:col-span-2">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 bg-primary/5 rounded-full blur-3xl" />
            <CardHeader className="relative z-10 p-4">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <Clock className="h-5 w-5" />
                Upcoming Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-4 pt-0">
              <div className="space-y-3">
                {upcomingLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="group flex items-start gap-3 rounded-lg border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <PlayCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {lesson.course}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.time}
                        </span>
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
