"use client"

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Clock, GraduationCap, Target, BookOpen, TrendingUp,
  PlayCircle, Youtube, Sparkles, Timer, ListChecks,
  Brain, Lightbulb, Map, Award, BookOpenCheck,
  LucideIcon, Loader2, BookPlus
} from 'lucide-react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { EnhancedActivityChart } from '@/components/dashboard/enhanced-activity-chart';
import { WeeklyCalendar } from '@/components/dashboard/weekly-calendar';
import { Id } from "@/convex/_generated/dataModel";
import { CourseGenerationModal } from '@/components/modals/course-generation-modal';

// Define interfaces for type safety
interface Course {
  _id: Id<"courses">;
  title: string;
  thumbnail?: string;
  progress: number;
  lastAccessedAt: number;
  completedLessons?: string[];
  sections?: {
    title: string;
    lessons?: {
      id: string;
      title: string;
      type: string;
    }[];
  }[];
  overview?: {
    skills?: string[];
    difficultyLevel?: string;
    totalDuration?: string;
  };
}

interface LearningActivity {
  _id: Id<"learning_activities">;
  type: string;
  timestamp: number;
  courseId?: Id<"courses">;
  metadata?: any;
  courseName?: string;
  assessmentTitle?: string;
}

interface UserStats {
  totalLearningHours?: number;
  coursesInProgress?: number;
  coursesCompleted?: number;
  projectsSubmitted?: number;
  streakDays?: number;
  longestStreak?: number;
  weeklyActivity?: number[];
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

interface Note {
  id: string | Id<"learning_activities">;
  title: string;
  course: string;
  date: string;
}

// This is our local task interface
interface DashboardTask {
  id: string;
  type: string;
  title: string;
  date: Date;
}

// This matches what the TaskCalendar component expects
interface CalendarTask {
  id: number;
  title: string;
  date: Date;
  type: "assignment" | "quiz" | "project";
}

type TabValue = 'inprogress';

export default function DashboardPage() {
  const [activeCourse, setActiveCourse] = useState<string>('');
  const [activeTime, setActiveTime] = useState<number>(0); // Track active login time in minutes
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);

  // Clerk auth
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();

  // Convex data fetching
  const userStats = useQuery(api.user_stats.getUserStats,
    isUserLoaded && isSignedIn ? { userId: user?.id || '' } : 'skip'
  ) as UserStats | undefined;

  const recentCourses = useQuery(api.courses.getRecentlyAddedCourses,
    isUserLoaded && isSignedIn ? { userId: user?.id || '', limit: 4 } : 'skip'
  ) as Course[] | undefined;

  const recentActivities = useQuery(api.user_stats.getRecentActivities,
    isUserLoaded && isSignedIn ? { userId: user?.id || '', limit: 10 } : 'skip'
  ) as { activities: LearningActivity[], cursor?: string } | undefined;

  const learningTrends = useQuery(api.user_stats.getLearningTrends,
    isUserLoaded && isSignedIn ? { userId: user?.id || '', timeframe: 'week' } : 'skip'
  ) as { weeklyActivity?: number[] } | undefined;

  // Set active course when data is loaded
  useEffect(() => {
    if (recentCourses && recentCourses.length > 0) {
      setActiveCourse(recentCourses[0]._id);
    }
  }, [recentCourses]);

  // Track active time for logged-in users
  useEffect(() => {
    if (isSignedIn && user?.id) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const storageKey = `user_${user.id}_active_time`;

      // Check if we have stored time data
      const storedTimeData = localStorage.getItem(storageKey);
      let initialTime = 1; // Default to 1 minute

      if (storedTimeData) {
        try {
          const { date, minutes } = JSON.parse(storedTimeData);
          // If the stored date is today, use the stored minutes, otherwise reset
          if (date === today) {
            initialTime = minutes;
          }
        } catch (error) {
          console.error("Error parsing stored time data:", error);
        }
      }

      // Initialize with stored value or default
      setActiveTime(initialTime);

      // Update active time every minute
      const interval = setInterval(() => {
        setActiveTime(prevTime => {
          const newTime = prevTime + 1;
          // Store the updated time in localStorage
          localStorage.setItem(storageKey, JSON.stringify({
            date: today,
            minutes: newTime
          }));
          return newTime;
        });
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [isSignedIn, user?.id]);

  // Create activity data from weekly activity using useMemo to prevent re-renders
  const activityData = React.useMemo(() => {
    if (learningTrends?.weeklyActivity) {
      return [
        { name: "Sun", hours: learningTrends.weeklyActivity[0] || 0 },
        { name: "Mon", hours: learningTrends.weeklyActivity[1] || 0 },
        { name: "Tue", hours: learningTrends.weeklyActivity[2] || 0 },
        { name: "Wed", hours: learningTrends.weeklyActivity[3] || 0 },
        { name: "Thu", hours: learningTrends.weeklyActivity[4] || 0 },
        { name: "Fri", hours: learningTrends.weeklyActivity[5] || 0 },
        { name: "Sat", hours: learningTrends.weeklyActivity[6] || 0 }
      ];
    }
    return [
      { name: "Sun", hours: 0 },
      { name: "Mon", hours: 0 },
      { name: "Tue", hours: 0 },
      { name: "Wed", hours: 0 },
      { name: "Thu", hours: 0 },
      { name: "Fri", hours: 0 },
      { name: "Sat", hours: 0 }
    ];
  }, [learningTrends?.weeklyActivity]);

  // Helper function to get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Convert DashboardTask to CalendarTask
  const mapTasksForCalendar = (tasks: DashboardTask[]): CalendarTask[] => {
    return tasks.map((task, index) => ({
      // Use index + 1 for numeric ID
      id: index + 1,
      title: task.title,
      date: task.date,
      // Map our task types to expected calendar task types
      type: task.type === "assessment" ? "assignment" :
        task.type === "project" ? "project" : "quiz"
    }));
  };

  // Loading state
  if (!isUserLoaded) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in state
  if (!isSignedIn) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] gap-4">
        <h2 className="text-2xl font-bold">Please sign in to view your dashboard</h2>
        <p className="text-muted-foreground">Sign in to access your personalized learning dashboard</p>
      </div>
    );
  }

  // Define learning stats based on user stats
  const learningStats: LearningStat[] = [
    {
      label: "Learning Hours",
      value: `${userStats?.totalLearningHours?.toFixed(1) || '0'}h`,
      icon: Clock,
      change: userStats?.totalLearningHours && userStats.totalLearningHours > 0
        ? { value: "+1.2h", type: "increase" as const }
        : undefined
    },
    {
      label: "Active Courses",
      value: `${userStats?.coursesInProgress || '0'}`,
      icon: GraduationCap,
      change: userStats?.coursesInProgress && userStats.coursesInProgress > 0
        ? { value: "+1", type: "increase" as const }
        : undefined
    },
    {
      label: "Completed",
      value: `${userStats?.coursesCompleted || '0'}`,
      icon: Target,
      change: userStats?.coursesCompleted && userStats.coursesCompleted > 0
        ? { value: "New", type: "increase" as const, showTrend: true }
        : undefined
    },
    {
      label: "Projects",
      value: `${userStats?.projectsSubmitted || '0'}`,
      icon: ListChecks,
      change: userStats?.projectsSubmitted && userStats.projectsSubmitted > 0
        ? { value: "+1", type: "increase" as const }
        : undefined
    }
  ];

  // Get current streak info
  const streak = {
    current: Math.max(userStats?.streakDays || 0, 1), // Ensure minimum streak of 1 for logged-in users
    longest: Math.max(userStats?.longestStreak || 0, 1), // Also ensure minimum longest streak is 1
    today: {
      minutes: activeTime, // Now tracking active login time instead of learning time
      tasks: recentActivities?.activities?.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length || 0
    }
  };

  const userName = user?.firstName || user?.username || 'Learner';
  const greeting = getGreeting();

  // Get selected course
  const selectedCourse = recentCourses?.find(course => course._id === activeCourse);

  // Find or generate recent notes
  const recentNotes: Note[] = [
    ...(recentActivities?.activities
      ?.filter(activity => activity.type.includes('note'))
      ?.slice(0, 2)
      ?.map(activity => ({
        id: activity._id,
        title: activity.metadata?.title || "Untitled Note",
        course: activity.courseName || "General",
        date: new Date(activity.timestamp).toLocaleDateString()
      })) || []),
    // Add placeholder if needed
    ...((!recentActivities?.activities?.length || recentActivities.activities.filter(a => a.type.includes('note')).length < 2)
      ? [{
        id: 'placeholder',
        title: "Create your first note",
        course: "Get Started",
        date: "Today"
      }]
      : [])
  ].slice(0, 2); // Ensure we only show max 2 notes

  // Create tasks for dashboard
  const dashboardTasks: DashboardTask[] = [
    // Show upcoming assessments from courses or placeholder
    ...(recentCourses?.flatMap(course =>
      course.sections?.flatMap(section =>
        section.lessons?.filter(lesson =>
          lesson.type === 'assessment' &&
          !course.completedLessons?.includes(lesson.id)
        ).map(lesson => ({
          id: lesson.id,
          type: "assessment",
          title: lesson.title,
          date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date in next week
        })) || []
      ) || []
    ).slice(0, 3) || []),
    // Add placeholder if needed
    ...(!recentCourses || recentCourses.length === 0 ? [{
      id: 'placeholder',
      type: "project",
      title: "Start your learning journey",
      date: new Date()
    }] : [])
  ].filter((task): task is DashboardTask => !!task); // Remove any potential undefined values

  // Convert tasks to calendar-compatible format
  const calendarTasks = mapTasksForCalendar(dashboardTasks);

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
                        {streak.current >= streak.longest && streak.longest > 0 && (
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
                        {streak.today.minutes > 0 && <span className="ml-1 text-xs">⭐</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>{streak.today.tasks} tasks done</span>
                        {streak.today.tasks > 0 && <span className="ml-1 text-xs">✅</span>}
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
                  onClick={() => setIsCourseModalOpen(true)}
                >
                  <BookPlus className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Generate Course</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 h-10 gap-2 px-4 bg-white/90 hover:bg-white text-primary hover:text-primary/90 shadow-lg"
                  onClick={() => window.location.href = '/courses'}
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Browse Courses</span>
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
        {/* Learning Journey and Activity Chart - Main column moved to the left */}
        <div className="space-y-6 md:col-span-2 order-1">
          <Card className="relative overflow-hidden">
            <CardHeader className="relative z-10 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <BookOpen className="h-5 w-5" />
                Learning Journey
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => window.location.href = '/courses'}
              >
                View All Courses
              </Button>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {recentCourses && recentCourses.length > 0 ? (
                <div>
                  {recentCourses.map((course) => (
                    <div
                      key={course._id}
                      className={`group rounded-lg border bg-card p-3 hover:border-primary/50 transition-all mb-4 ${course._id === activeCourse ? 'border-primary' : ''}`}
                      onClick={() => setActiveCourse(course._id)}
                    >
                      <div className="flex gap-3">
                        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-40">
                          <Image
                            src={course.thumbnail || "/placeholder.jpg"}
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
                                Last accessed {new Date(course.lastAccessedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => window.location.href = `/courses/${course._id}`}
                            >
                              {course.progress === 0 ? 'Start' : course.progress === 100 ? 'Review' : 'Continue'}
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {course.completedLessons?.length || 0}/{(course.sections?.flatMap(s => s.lessons)?.length || 0)} lessons
                              </span>
                              <span>{course.progress || 0}%</span>
                            </div>
                            <Progress value={course.progress || 0} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedCourse && (
                    <div className="bg-muted/50 rounded-lg p-4 mt-4">
                      <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                        <Brain className="h-4 w-4 text-primary" />
                        Course Structure for {selectedCourse.title}
                      </h4>
                      {/* Rest of selected course content remains the same */}
                      <div className="grid grid-cols-1 gap-3">
                        {selectedCourse.sections?.slice(0, 4).map((section, index) => (
                          <div key={index} className="bg-background rounded p-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium">Section {index + 1}: {section.title}</span>
                              <span>{section.lessons?.length || 0} lessons</span>
                            </div>
                            <Progress
                              value={
                                (selectedCourse.completedLessons?.filter(
                                  lessonId => section.lessons?.some(l => l.id === lessonId)
                                ).length || 0) / (section.lessons?.length || 1) * 100
                              }
                              className="h-1.5"
                            />
                          </div>
                        ))}
                      </div>

                      {selectedCourse.sections && selectedCourse.sections.length > 4 && (
                        <div className="mt-2 text-center">
                          <Button
                            variant="link"
                            className="text-xs"
                            onClick={() => window.location.href = `/courses/${selectedCourse._id}`}
                          >
                            View all {selectedCourse.sections.length} sections
                          </Button>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <h5 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                            <Map className="h-3.5 w-3.5 text-primary" />
                            Topics Covered
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedCourse.overview?.skills?.slice(0, 5).map((skill, idx) => (
                              <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {skill}
                              </span>
                            )) || (
                                <span className="text-xs text-muted-foreground">No topics available</span>
                              )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                            <Lightbulb className="h-3.5 w-3.5 text-primary" />
                            Difficulty Level
                          </h5>
                          <div className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <Award className="h-3 w-3 text-primary" />
                              <span>{selectedCourse.overview?.difficultyLevel || 'Beginner'}</span>
                              <span className="text-muted-foreground">
                                ({selectedCourse.overview?.totalDuration || 'Unknown duration'})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="bg-muted/40 mx-auto rounded-full w-12 h-12 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No courses yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Start your learning journey by enrolling in a course
                  </p>
                  <Button
                    onClick={() => window.location.href = '/explore'}
                    size="sm"
                  >
                    Explore Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <EnhancedActivityChart
            data={activityData}
            showAverage={true}
            defaultView="weekly"
            title="Learning Activity"
          />
        </div>

        {/* Right column - Calendar and other widgets */}
        <div className="space-y-6 order-2">
          {/* Weekly Calendar (new modern component) */}
          <WeeklyCalendar tasks={calendarTasks} />

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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.location.href = '/library'}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {recentNotes.map(note => {
                  // Generate a consistent key that's always a string
                  const noteKey = typeof note.id === 'string'
                    ? note.id
                    : String(note.id); // Convert to string explicitly

                  return (
                    <div
                      key={noteKey}
                      className="rounded-md border p-2.5 hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => note.id === 'placeholder'
                        ? window.location.href = '/library?create=note'
                        : window.location.href = `/library?note=${note.id}`
                      }
                    >
                      <h5 className="text-sm font-medium mb-1">{note.title}</h5>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{note.course}</span>
                        <span>{note.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                className="w-full text-xs h-8 mt-2"
                variant="outline"
                onClick={() => window.location.href = '/library?create=note'}
              >
                Create New Note
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities?.activities && recentActivities.activities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.activities.slice(0, 5).map((activity) => (
                    <div key={activity._id} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {activity.type.includes('course') ? (
                          <BookOpen className="h-4 w-4 text-primary" />
                        ) : activity.type.includes('assessment') ? (
                          <ListChecks className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium">
                          {activity.type === 'started_course' ? 'Started a new course' :
                            activity.type === 'completed_course' ? 'Completed a course' :
                              activity.type === 'completed_assessment' ? 'Completed an assessment' :
                                activity.type === 'earned_points' ? `Earned ${activity.metadata?.points || 0} points` :
                                  'Learning activity'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.courseName || activity.metadata?.title || 'Learning journey'} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-muted-foreground">No activities recorded yet</p>
                </div>
              )}

              <Button
                className="w-full text-xs h-8 mt-2"
                variant="outline"
                onClick={() => window.location.href = '/explore'}
              >
                Start Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Course Generation Modal */}
      <CourseGenerationModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
      />
    </div>
  );
}
