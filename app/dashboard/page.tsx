"use client"

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Clock, GraduationCap, Target, BookOpen, TrendingUp,
  PlayCircle, Youtube, Sparkles, Timer, ListChecks,
  BookOpenCheck, type LucideIcon, Loader2, BookPlus, Flame
} from 'lucide-react';
import Image from 'next/image';
import { useUser } from "@clerk/clerk-react";
import { EnhancedActivityChart } from '@/components/dashboard/enhanced-activity-chart';
import { WeeklyCalendar } from '@/components/dashboard/weekly-calendar';
import { CourseGenerationModal } from '@/components/modals/course-generation-modal';
import { useUserStats, useRecentCourses, useRecentActivities, useLearningTrends } from '@/hooks/use-dashboard';
import { useUserActivity } from '@/hooks/use-user-activity';
import { useStreak } from '@/hooks/use-streak';
import { useStreakCelebration } from '@/hooks/use-streak-celebration';
import { StreakCelebrationPopup } from '@/components/streak/streak-celebration-popup';
import { StreakBadge } from '@/components/streak/StreakBadge';
import { SRSReviewWidget } from '@/components/dashboard/srs-review-widget';

// Import interfaces from our hook
import type { Course, LearningActivity, UserStats } from '@/hooks/use-dashboard';

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
  id: string;
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
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);

  // Clerk auth
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();

  // Supabase data fetching
  const { userStats, loading: statsLoading } = useUserStats();
  const { recentCourses, loading: coursesLoading } = useRecentCourses(4);
  const { activities: recentActivitiesData, loading: activitiesLoading } = useRecentActivities(10);
  const { trends: learningTrends, loading: trendsLoading } = useLearningTrends('week');

  // User activity tracking with idle detection
  const { activeTime } = useUserActivity({
    idleTimeout: 5 * 60 * 1000, // 5 minutes idle timeout
    syncInterval: 5 * 60 * 1000  // Sync to database every 5 minutes
  });

  // Streak tracking
  const { current: currentStreak, longest: longestStreak, loading: streakLoading } = useStreak({
    autoUpdate: true // Automatically update streak on login
  });

  // Streak celebration popup
  const {
    showCelebration,
    setShowCelebration,
    streak: celebrationStreak,
    longestStreak: celebrationLongestStreak,
    handleClose: handleCloseCelebration
  } = useStreakCelebration({
    autoShow: true,
    onlyOnDashboard: true
  });

  // Format activities to match the expected structure
  const recentActivities = recentActivitiesData ? {
    activities: recentActivitiesData,
    cursor: undefined
  } : undefined;



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
      value: `${userStats?.total_learning_hours?.toFixed(1) || '0'}h`,
      icon: Clock,
      change: userStats?.total_learning_hours && userStats.total_learning_hours > 0
        ? { value: "+1.2h", type: "increase" as const }
        : undefined
    },
    {
      label: "Active Courses",
      value: `${userStats?.courses_in_progress || '0'}`,
      icon: GraduationCap,
      change: userStats?.courses_in_progress && userStats.courses_in_progress > 0
        ? { value: "+1", type: "increase" as const }
        : undefined
    },
    {
      label: "Completed",
      value: `${userStats?.courses_completed || '0'}`,
      icon: Target,
      change: userStats?.courses_completed && userStats.courses_completed > 0
        ? { value: "New", type: "increase" as const, showTrend: true }
        : undefined
    },
    {
      label: "Projects",
      value: `${userStats?.projects_submitted || '0'}`,
      icon: ListChecks,
      change: userStats?.projects_submitted && userStats.projects_submitted > 0
        ? { value: "+1", type: "increase" as const }
        : undefined
    }
  ];

  // Get current streak info
  const streak = {
    current: streakLoading ? 1 : currentStreak, // Use the streak from our hook
    longest: streakLoading ? 1 : longestStreak, // Use the longest streak from our hook
    today: {
      minutes: activeTime, // Now tracking active login time instead of learning time
      tasks: recentActivities?.activities?.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length || 0
    }
  };

  const userName = user?.firstName || user?.username || 'Learner';
  const greeting = getGreeting();


  // Find or generate recent notes
  const recentNotes: Note[] = [
    ...(recentActivities?.activities
      ?.filter(activity => activity.type.includes('note'))
      ?.slice(0, 2)
      ?.map(activity => ({
        id: activity.id,
        title: activity.metadata?.title || "Untitled Note",
        course: activity.course_name || "General",
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
        section.lessons?.filter((lesson: any) =>
          lesson.type === 'assessment' &&
          !course.completed_lessons?.includes(lesson.id)
        ).map((lesson: any) => ({
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
    <div className="mx-auto space-y-6 pt-6 w-full lg:w-[90%] px-4 sm:px-6 max-w-[1400px]">

      {/* Streak Celebration Popup */}
      < StreakCelebrationPopup
        streak={celebrationStreak}
        longestStreak={celebrationLongestStreak}
        onClose={handleCloseCelebration}
        isOpen={showCelebration}
      />

      {/* Hero Section */}
      < div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/90 p-4 sm:p-6 shadow-xl" >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl lg:text-4xl">
                {greeting} <span className="text-xl">👋</span> <span className="text-white">{userName}</span>
              </h1>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/10 shadow-lg">
                <StreakBadge
                  current={streak.current}
                  longest={streak.longest}
                  todayMinutes={streak.today.minutes}
                  todayTasks={streak.today.tasks}
                  loading={streakLoading}
                />
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
      </div >

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Learning Journey and Activity Chart - Main column moved to the left */}
        <div className="space-y-6 md:col-span-2 order-1 flex flex-col h-full">
          {/* Learning Journey Card - Focused on quick course access */}
          <Card className="relative overflow-hidden">
            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <BookOpen className="h-5 w-5" />
                Continue Learning
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => window.location.href = '/courses'}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              {recentCourses && recentCourses.length > 0 ? (
                <div className="space-y-3">
                  {recentCourses.slice(0, 2).map((course, index) => (
                    <div
                      key={course.id}
                      className={`group rounded-lg border bg-card p-4 hover:border-primary/50 transition-all cursor-pointer ${index === 0 ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => window.location.href = `/courses/${course.id}`}
                    >
                      <div className="flex gap-4">
                        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg sm:w-36">
                          <Image
                            src={course.thumbnail || "/placeholder.jpg"}
                            alt={course.title}
                            width={400}
                            height={220}
                            className="object-cover h-full w-full"
                            unoptimized
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="h-10 w-10 text-white" />
                          </div>
                          {index === 0 && (
                            <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                              Most Recent
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {course.last_accessed_at
                                ? `Last watched ${new Date(course.last_accessed_at).toLocaleDateString()}`
                                : 'Not started'}
                            </p>
                          </div>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Progress value={course.progress || 0} className="h-2 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                                {course.progress || 0}%
                              </span>
                            </div>
                            <Button
                              variant={index === 0 ? "default" : "secondary"}
                              size="sm"
                              className="w-full h-9 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/courses/${course.id}`;
                              }}
                            >
                              <PlayCircle className="h-4 w-4" />
                              {course.progress === 0 ? 'Start Learning' : course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="bg-muted/40 mx-auto rounded-full w-12 h-12 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No courses yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Start your learning journey by exploring our courses
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


          {/* Learning Activity Chart - Fixed height at bottom */}
          <div className="flex-none">
            <EnhancedActivityChart
              data={activityData}
              showAverage={true}
              defaultView="weekly"
              title="Learning Activity"
            />
          </div>

          {/* Recommended For You Section - Moved from right column */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden flex-none">
            <div className="p-4 flex items-center gap-2 border-b">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-base">Recommended for You</h3>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  {
                    id: 'rec1',
                    title: 'Introduction to Machine Learning',
                    level: 'Beginner',
                    duration: '4h 30m',
                    lessons: 12,
                    category: 'Data Science'
                  },
                  {
                    id: 'rec2',
                    title: 'Web Development Bootcamp',
                    level: 'Intermediate',
                    duration: '8h 15m',
                    lessons: 24,
                    category: 'Web'
                  }
                ].map((course) => (
                  <div
                    key={course.id}
                    className="rounded-md border p-4 hover:border-primary/50 transition-all cursor-pointer bg-card hover:bg-muted/30 h-full flex flex-col justify-between"
                    onClick={() => window.location.href = '/explore'}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h5 className="text-sm font-semibold leading-tight">{course.title}</h5>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                          {course.level}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {course.lessons}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {course.category}
                      </Badge>
                      <span className="text-xs text-primary font-medium">Explore</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/explore'}
              >
                Explore More Courses
              </Button>
            </div>
          </div>
        </div>

        {/* Right column - Calendar, Notes and Recommendations */}
        <div className="space-y-6 order-2 flex flex-col h-full">
          {/* Weekly Calendar (moved to top) */}
          <div className="flex-none">
            <WeeklyCalendar tasks={calendarTasks} />
          </div>

          {/* Scrollable content area for equal heights */}
          <div className="flex-1 space-y-6 overflow-auto">
            {/* Spaced Repetition Review Widget */}
            <SRSReviewWidget />

            {/* Recent Notes Section */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b">
                <h3 className="font-medium text-base flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-primary" />
                  Recent Notes
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.location.href = '/library'}
                >
                  View All
                </Button>
              </div>

              <div className="p-4">
                {recentNotes.length > 0 ? (
                  <div className="space-y-3">
                    {recentNotes.map((note) => {
                      const noteKey = typeof note.id === 'string' ? note.id : String(note.id);
                      return (
                        <div
                          key={noteKey}
                          className="rounded-md border p-3 hover:border-primary/50 transition-all cursor-pointer bg-card hover:bg-muted/30"
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
                ) : (
                  <div className="text-center py-6 px-4">
                    <h4 className="font-medium mb-1">Create your first note</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start taking notes to enhance your learning experience. Click to create your first note.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.location.href = '/library?create=note'}
                    >
                      Get Started
                    </Button>
                  </div>
                )}

                <Button
                  className="w-full mt-3"
                  variant="default"
                  size="sm"
                  onClick={() => window.location.href = '/library?create=note'}
                >
                  Create New Note
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <CourseGenerationModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
      />
    </div >
  );
}
