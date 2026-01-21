"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

// Public types expected by `app/dashboard/page.tsx` — kept minimal and permissive
export interface Course {
  id: string;
  title: string;
  description?: string;
  progress?: number;
  thumbnail?: string;
  sections?: any[]; // sections/modules with lessons — optional
  enrollment?: any;
  completed_lessons?: string[];
  last_accessed_at?: string;
  overview?: any;
}

export interface LearningActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  metadata?: any;
  course_name?: string;
}

export interface UserStats {
  // fields the dashboard expects
  total_learning_hours?: number;
  courses_in_progress?: number;
  courses_completed?: number;
  projects_submitted?: number;
}

/**
 * Map the Convex `getUserStats` response into the shape the dashboard expects.
 * We keep sensible defaults so the UI never crashes when a field is missing.
 */
export function useUserStats() {
  const { user } = useUser();
  const stats = useQuery(
    api.dashboard.getUserStats,
    user?.id ? { userId: user.id } : "skip",
  );

  if (!user?.id) {
    return {
      userStats: {
        total_learning_hours: 0,
        courses_in_progress: 0,
        courses_completed: 0,
        projects_submitted: 0,
      },
      loading: false,
    };
  }

  if (!stats)
    return {
      userStats: {
        total_learning_hours: 0,
        courses_in_progress: 0,
        courses_completed: 0,
        projects_submitted: 0,
      },
      loading: true,
    };

  // total_learning_hours isn't tracked in Convex dashboard query; approximate it using weekly activity count
  const weeklyActivity = stats.streak?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0];
  const totalLearningHours = weeklyActivity.reduce(
    (a: number, b: number) => a + (Number(b) || 0),
    0,
  );

  return {
    userStats: {
      total_learning_hours: totalLearningHours,
      courses_in_progress:
        (stats.enrollmentStats?.inProgressCourses ??
          stats.enrollmentStats?.inProgress) ||
        0,
      courses_completed:
        (stats.enrollmentStats?.completedCourses ??
          stats.enrollmentStats?.completed) ||
        0,
      projects_submitted: stats.createdCoursesCount ?? 0,
    },
    loading: !stats,
  };
}

/**
 * Fetch recent courses and normalize fields used by the dashboard UI.
 */
export function useRecentCourses(limit: number = 5) {
  const { user } = useUser();
  const courses = useQuery(
    api.dashboard.getRecentCourses,
    user?.id ? { userId: user.id, limit } : "skip",
  );

  if (!user?.id) return { recentCourses: [], loading: false };
  if (!courses) return { recentCourses: [], loading: true };

  const mapped = (courses || []).filter(Boolean).map(
    (course: any) =>
      ({
        id:
          course._id ||
          course._id?.toString?.() ||
          course.id ||
          String(course._id || ""),
        title: course.title || "Untitled",
        description: course.description || course.summary || "",
        progress:
          course.enrollment?.progress ?? course.enrollment_progress ?? 0,
        thumbnail: (() => {
          // Prefer actual thumbnail URL
          const thumb = course.thumbnail;
          if (
            thumb &&
            !thumb.includes("youtube.com/watch") &&
            !thumb.includes("youtu.be/")
          ) {
            return thumb;
          }
          // Try to extract YouTube video ID from sourceUrl and construct thumbnail
          const sourceUrl =
            course.sourceUrl || course.source_url || thumb || "";
          const ytMatch = sourceUrl.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
          );
          if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
          }
          return sourceUrl || "";
        })(),
        sections: course.modules || course.sections || [],
        completed_lessons:
          course.enrollment?.completedLessonIds ||
          course.completed_lessons ||
          [],
        last_accessed_at:
          course.enrollment?.lastAccessedAt ||
          course.last_accessed_at ||
          new Date().toISOString(),
        overview: course.overview || course.detailedOverview || {},
      }) as Course,
  );

  return { recentCourses: mapped, loading: !courses };
}

/**
 * Fetch recent activities and normalize them for the dashboard.
 */
export function useRecentActivities(limit: number = 10) {
  const { user } = useUser();
  const stats = useQuery(
    api.dashboard.getUserStats,
    user?.id ? { userId: user.id } : "skip",
  );

  if (!user?.id) return { activities: [], loading: false };
  if (!stats) return { activities: [], loading: true };

  const activities = (stats.recentActivities || []).slice(0, limit).map(
    (activity: any, idx: number) =>
      ({
        id: `${activity.type}-${activity.createdAt}-${idx}`,
        type: activity.type || activity.activityType || "activity",
        title:
          activity.metadata?.title ||
          getActivityTitle(activity) ||
          activity.type,
        timestamp:
          activity.createdAt || activity.created_at || new Date().toISOString(),
        metadata: activity.metadata || {},
        course_name:
          activity.metadata?.courseName || activity.course_name || "",
      }) as LearningActivity,
  );

  return { activities, loading: !stats };
}

/**
 * Return weekly activity in an object with `weeklyActivity` array where index 0 = Sun ... 6 = Sat.
 */
export function useLearningTrends(period: string = "30d") {
  const { user } = useUser();
  const days =
    period === "week" || period === "7d" ? 7
    : period === "30d" ? 30
    : 90;
  const activity = useQuery(
    api.dashboard.getLearningActivity,
    user?.id ? { userId: user.id, days } : "skip",
  );

  if (!user?.id)
    return {
      trends: { weeklyActivity: [0, 0, 0, 0, 0, 0, 0] },
      loading: false,
    };
  if (!activity)
    return { trends: { weeklyActivity: [0, 0, 0, 0, 0, 0, 0] }, loading: true };

  // activity is an object keyed by date (YYYY-MM-DD) => count
  const countsByDate: Record<string, number> = activity || {};

  // Prepare last 7 days counts indexed by weekday (Sun=0..Sat=6)
  const now = new Date();
  const weekly: number[] = [0, 0, 0, 0, 0, 0, 0];
  Object.entries(countsByDate).forEach(([dateStr, count]) => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const weekday = d.getDay();
      weekly[weekday] = (weekly[weekday] || 0) + (Number(count) || 0);
    }
  });

  return { trends: { weeklyActivity: weekly }, loading: !activity };
}

// Helper function to get activity title
function getActivityTitle(activity: any): string {
  const type = activity.type || activity.activityType;
  switch (type) {
    case "course_enrolled":
    case "enrolled":
      return "Enrolled in a course";
    case "lesson_completed":
    case "completed_lesson":
      return "Completed a lesson";
    case "quiz_attempted":
      return "Attempted a quiz";
    case "course_generated":
      return "Generated a course";
    case "login":
      return "Logged in";
    default:
      return (
        activity.metadata?.title || activity.metadata?.action || "Activity"
      );
  }
}
