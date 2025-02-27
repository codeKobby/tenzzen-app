"use client"

import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock, GraduationCap, Target, BookOpen, TrendingUp,
  PlayCircle, Youtube, Sparkles, Timer, ListChecks,
  Brain, Lightbulb, Map, Award, BookOpenCheck,
  LucideIcon
} from 'lucide-react';
import Image from 'next/image';
import { LineChart } from '@/components/dashboard/line-chart';
import { TaskCalendar } from '@/components/dashboard/calendar';

interface KnowledgeMapItem {
  id: number;
  title: string;
  mastery: number;
}

interface Project {
  id: number;
  title: string;
  difficulty: string;
}

interface Course {
  id: number;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: string;
  thumbnail: string;
  knowledgeMap: KnowledgeMapItem[];
  nextConcepts: string[];
  recommendedProjects: Project[];
}

interface RecommendedCourse {
  id: number;
  title: string;
  match: number;
  reason: string;
  thumbnail: string;
  duration: string;
}

interface LearningPathData {
  courses: Course[];
  recommendedCourses: RecommendedCourse[];
}

interface StatChange {
  value: string;
  type: 'increase' | 'decrease';
  showTrend?: boolean;
}

interface LearningStat {
  label: string;
  value: string;
  icon: LucideIcon;
  change?: StatChange;
}

type TabValue = 'inprogress' | 'recommended';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('inprogress');
  const [activeCourse, setActiveCourse] = useState<number>(1);

  const learningPathData: LearningPathData = {
    courses: [
      {
        id: 1,
        title: "Advanced Machine Learning",
        progress: 75,
        totalLessons: 48,
        completedLessons: 36,
        lastAccessed: "2 hours ago",
        thumbnail: "/placeholder.jpg",
        knowledgeMap: [
          { id: 1, title: "Neural Networks", mastery: 85 },
          { id: 2, title: "Supervised Learning", mastery: 90 },
          { id: 3, title: "Data Preprocessing", mastery: 75 },
          { id: 4, title: "Model Evaluation", mastery: 65 }
        ],
        nextConcepts: ["Reinforcement Learning", "GANs"],
        recommendedProjects: [
          { id: 1, title: "Image Classification System", difficulty: "Intermediate" }
        ]
      },
      {
        id: 2,
        title: "Full-Stack Web Development",
        progress: 45,
        totalLessons: 64,
        completedLessons: 29,
        lastAccessed: "Yesterday",
        thumbnail: "/placeholder.jpg",
        knowledgeMap: [
          { id: 1, title: "React Fundamentals", mastery: 80 },
          { id: 2, title: "API Integration", mastery: 65 },
          { id: 3, title: "Database Design", mastery: 50 },
          { id: 4, title: "Authentication", mastery: 40 }
        ],
        nextConcepts: ["State Management", "Testing"],
        recommendedProjects: [
          { id: 1, title: "Full-Stack CRUD Application", difficulty: "Intermediate" }
        ]
      }
    ],
    recommendedCourses: [
      {
        id: 3,
        title: "Advanced JavaScript Concepts",
        match: 95,
        reason: "Based on your Web Development progress",
        thumbnail: "/placeholder.jpg",
        duration: "12 hours"
      },
      {
        id: 4,
        title: "Data Visualization with D3.js",
        match: 87,
        reason: "Complements your Machine Learning skills",
        thumbnail: "/placeholder.jpg",
        duration: "8 hours"
      }
    ]
  };

  const learningStats: LearningStat[] = [
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
  ];

  const activityData = [
    { date: "Mon", hours: 2.5 },
    { date: "Tue", hours: 3.2 },
    { date: "Wed", hours: 4.1 },
    { date: "Thu", hours: 2.8 },
    { date: "Fri", hours: 3.9 },
    { date: "Sat", hours: 1.5 },
    { date: "Sun", hours: 2.2 }
  ];

  const userName = 'Alex';
  const greeting = 'Good morning';
  const streak = {
    current: 12,
    longest: 30,
    today: {
      minutes: 45,
      tasks: 2
    }
  };

  const selectedCourse = learningPathData.courses.find(course => course.id === activeCourse);

  return (
    <div className="mx-auto space-y-6 pt-6 w-full lg:w-[90%]">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/90 p-4 sm:p-6 shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl lg:text-4xl">
                {greeting} <span className="text-xl">👋</span> <span className="text-white">{userName}</span>
              </h1>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="rounded-lg bg-white/10 p-3.5 backdrop-blur-[2px] shadow-sm">
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">
                      {streak.current}
                    </span>
                    <div className="flex flex-col justify-between">
                      <span className="text-sm text-primary-foreground/90">day streak</span>
                      <p className="text-xs text-primary-foreground/80 flex items-center gap-1.5">
                        Best: {streak.longest} days
                        {streak.current >= streak.longest && (
                          <span className="text-xs">🏆</span>
                        )}
                      </p>
                    </div>
                    <span className="text-lg">
                      {streak.current >= 30 ? '🔥' :
                        streak.current >= 14 ? '💪' :
                          streak.current >= 7 ? '✨' : '🎯'}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <div className="flex flex-col gap-1.5 text-xs text-primary-foreground/90">
                      <div className="flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5" />
                        <span>{streak.today.minutes}m today</span>
                        <span className="ml-1 text-xs">⭐</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>{streak.today.tasks} tasks done</span>
                        <span className="ml-1 text-xs">✅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                  <p className="text-xs font-medium text-primary-foreground/70 truncate">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-primary-foreground sm:text-lg">
                      {stat.value}
                    </span>
                    {stat.change && (
                      <span className={
                        `text-xs font-medium flex items-center gap-1 px-1.5 py-0.5 rounded-full 
                        ${stat.change.type === "increase"
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-red-400 bg-red-400/10"}`
                      }>
                        {stat.change.value}
                        {stat.change.showTrend && (
                          <span className="ml-0.5">
                            {stat.change.type === "increase"
                              ? <TrendingUp className="h-3 w-3" />
                              : <TrendingUp className="h-3 w-3 transform rotate-180" />}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card className="relative overflow-hidden">
            <CardHeader className="relative z-10 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <BookOpen className="h-5 w-5" />
                Learning Journey
              </CardTitle>
              <Tabs
                value={activeTab}
                onValueChange={(value: string) => setActiveTab(value as TabValue)}
                className="space-y-0"
              >
                <TabsList className="grid h-7 w-[240px] grid-cols-2 p-1">
                  <TabsTrigger value="inprogress" className="text-xs">In Progress</TabsTrigger>
                  <TabsTrigger value="recommended" className="text-xs">Recommended</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {activeTab === 'inprogress' ? (
                <div>
                  {learningPathData.courses.map((course) => (
                    <div
                      key={course.id}
                      className={`group rounded-lg border bg-card p-3 hover:border-primary/50 transition-all mb-4 ${course.id === activeCourse ? 'border-primary' : ''}`}
                      onClick={() => setActiveCourse(course.id)}
                    >
                      <div className="flex gap-3">
                        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-40">
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            width={400}
                            height={220}
                            className="object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle className="h-8 w-8 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium leading-snug tracking-tight group-hover:text-primary transition-colors">
                                {course.title}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Last accessed {course.lastAccessed}
                              </p>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs"
                            >
                              {course.progress === 0 ? 'Start' : course.progress === 100 ? 'Review' : 'Continue'}
                            </Button>
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

                  {selectedCourse && (
                    <div className="bg-muted/50 rounded-lg p-4 mt-4">
                      <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                        <Brain className="h-4 w-4 text-primary" />
                        Knowledge Progress for {selectedCourse.title}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCourse.knowledgeMap.map(concept => (
                          <div key={concept.id} className="bg-background rounded p-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{concept.title}</span>
                              <span className="font-medium">{concept.mastery}%</span>
                            </div>
                            <Progress value={concept.mastery} className="h-1.5" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <h5 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                            <Map className="h-3.5 w-3.5 text-primary" />
                            Next Concepts
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedCourse.nextConcepts.map((concept, idx) => (
                              <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                            <Lightbulb className="h-3.5 w-3.5 text-primary" />
                            Recommended Projects
                          </h5>
                          <div className="text-xs">
                            {selectedCourse.recommendedProjects.map(project => (
                              <div key={project.id} className="flex items-center gap-1.5">
                                <Award className="h-3 w-3 text-primary" />
                                <span>{project.title}</span>
                                <span className="text-muted-foreground">({project.difficulty})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {learningPathData.recommendedCourses.map(course => (
                    <div key={course.id} className="group flex gap-3 rounded-lg border bg-card p-3 hover:border-primary/50 transition-all">
                      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-36">
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          width={400}
                          height={220}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium leading-snug tracking-tight group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{course.match}% match</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{course.reason}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Enroll
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Target className="h-5 w-5" />
                  Learning Activity
                </CardTitle>
                <Tabs defaultValue="week" className="space-y-0">
                  <TabsList className="grid h-7 w-[120px] grid-cols-2 p-1">
                    <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
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

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpenCheck className="h-4 w-4" />
                Learning Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Recent Notes</h4>
                <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
              </div>

              <div className="space-y-3">
                {[
                  { id: 1, title: "Neural Network Architectures", course: "Advanced ML", date: "Today" },
                  { id: 2, title: "React Hooks Deep Dive", course: "Web Development", date: "Yesterday" }
                ].map(note => (
                  <div key={note.id} className="rounded-md border p-2.5 hover:border-primary/50 transition-all cursor-pointer">
                    <h5 className="text-sm font-medium mb-1">{note.title}</h5>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{note.course}</span>
                      <span>{note.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full text-xs h-8 mt-2" variant="outline">
                Create New Note
              </Button>
            </CardContent>
          </Card>

          <TaskCalendar
            tasks={[
              {
                id: 1,
                type: "assignment",
                title: "Advanced Data Structures",
                date: new Date("2024-02-21 10:00:00")
              },
              {
                id: 2,
                type: "quiz",
                title: "Neural Networks Basics",
                date: new Date("2024-02-22 14:00:00")
              },
              {
                id: 3,
                type: "project",
                title: "JavaScript Closures Quiz",
                date: new Date("2024-02-20 18:00:00")
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
