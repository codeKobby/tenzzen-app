"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export interface RecommendedCourse {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  difficulty?: string;
  duration?: string;
  lessonCount?: number;
  enrollmentCount?: number;
  trustScore?: number;
}

/**
 * Hook to fetch recommended courses based on user's enrollment categories/skills.
 * Falls back to popular public courses if user has no enrollments.
 */
export function useRecommendedCourses(limit: number = 4) {
  const { user } = useUser();

  const recommendations = useQuery(
    api.dashboard.getRecommendedCourses,
    user?.id ? { userId: user.id, limit } : "skip",
  );

  if (!user?.id) {
    return { recommendedCourses: [], loading: false };
  }

  if (recommendations === undefined) {
    return { recommendedCourses: [], loading: true };
  }

  const mapped: RecommendedCourse[] = (recommendations || [])
    .filter(Boolean)
    .map((course: any) => ({
      id: course._id || course.id || String(course._id || ""),
      title: course.title || "Untitled Course",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      category: course.category || "General",
      difficulty: course.difficulty || "Beginner",
      duration:
        course.overview?.total_duration || course.estimatedDuration || "",
      lessonCount:
        course.lessonCount ||
        course.sections?.reduce(
          (acc: number, s: any) => acc + (s.lessons?.length || 0),
          0,
        ) ||
        0,
      enrollmentCount: course.enrollmentCount || 0,
      trustScore: course.trustScore || 0,
    }));

  return { recommendedCourses: mapped, loading: false };
}
