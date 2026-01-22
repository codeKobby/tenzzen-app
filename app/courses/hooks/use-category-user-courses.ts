"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Course } from "../types";

interface UseCategoryUserCoursesOptions {
  limit?: number;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
  initialCategory?: string;
}

export function useCategoryUserCourses(
  options: UseCategoryUserCoursesOptions = {},
) {
  const { user } = useUser();
  const searchParams = useSearchParams();

  // Get current category from URL or use initialCategory
  const currentCategory =
    searchParams.get("category") || options.initialCategory || "all";

  // Fetch user's enrolled courses with full metadata
  const userEnrollments = useQuery(
    api.enrollments.getEnrolledCoursesWithDetails,
    user?.id ? { userId: user.id } : "skip",
  );

  // Transform courses to the format expected by components
  const courses: Course[] =
    userEnrollments ?
      userEnrollments
        .filter(
          (course): course is NonNullable<typeof course> => course !== null,
        )
        .map((course) => ({
          id: course._id,
          title: course.title,
          description: course.description,
          progress: course.progress,
          thumbnail:
            course.thumbnail ||
            course.sourceUrl ||
            "/placeholders/course-thumbnail.jpg",
          image:
            course.thumbnail ||
            course.sourceUrl ||
            "/placeholders/course-thumbnail.jpg",
          category: course.categoryName || "General",
          enrolledAt: course.enrolledAt,
          lastAccessed: course.lastAccessed,
          tags: course.tags || [],
          videoId: course.sourceId || "",
          isEnrolled: true,
          metadata: {
            duration: course.duration_seconds,
            difficulty: course.difficulty,
          },
          total_lessons: course.total_lessons,
          duration_seconds: course.duration_seconds,
          lessonsCompleted: Math.round(
            (course.progress / 100) * course.total_lessons,
          ),
        }))
    : [];

  // Filter courses by category
  const filteredCourses = courses.filter((course) => {
    if (currentCategory === "all") return true;

    // Normalize category name to slug format for comparison
    const courseCategorySlug = (course.category || "General")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    return courseCategorySlug === currentCategory.toLowerCase();
  });

  // Get recent courses (last 2)
  const recentCourses = filteredCourses.slice(0, 2);

  // Get unique categories from courses
  const categoryMap = new Map<string, number>();
  courses.forEach((course) => {
    const cat = course.category || "Uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });

  const categories = Array.from(categoryMap.entries())
    .filter(([name]) => {
      const lowerName = name.toLowerCase();
      return lowerName !== "uncategorized" && lowerName !== "general";
    })
    .map(([name, count]) => ({
      name,
      slug: name.toLowerCase().trim().replace(/\s+/g, "-"),
      courseCount: count,
    }));

  // Load more functionality (simplified) - Placeholder for now
  const loadMore = useCallback(() => {
    // Implement pagination if needed
  }, []);

  return {
    courses: filteredCourses,
    recentCourses,
    categories,
    loading: userEnrollments === undefined,
    loadingMore: false,
    error: null,
    totalCount: filteredCourses.length,
    hasMore: false,
    currentCategory,
    loadMore,
  };
}
