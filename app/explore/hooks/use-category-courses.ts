"use client";

import { Course } from "@/app/courses/types";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UseCategoryCoursesOptions {
  limit?: number;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
  initialCategory?: string;
  interestedCategories?: string[];
}

export function useCategoryCourses(options: UseCategoryCoursesOptions = {}) {
  const searchParams = useSearchParams();
  const currentCategory =
    searchParams.get("category") || options.initialCategory || "all";

  const sortBy = options.sortBy || "relevance";
  const numItems = options.limit || 12;

  // 1. Determine which paginated query to use based on sortBy
  let query: any = api.courses.getPublicCoursesPaginated;
  if (sortBy === "trending" || sortBy === "enrollments") {
    query = api.courses.getTrendingCoursesPaginated;
  } else if (sortBy === "top_rated" || sortBy === "rating") {
    query = api.courses.getTopRatedCoursesPaginated;
  } else if (sortBy === "new" || sortBy === "recent") {
    query = api.courses.getNewCoursesPaginated;
  }

  // 2. Use Paginated Query
  const { results, status, loadMore } = usePaginatedQuery(
    query,
    {
      category: currentCategory,
      searchQuery: options.searchQuery,
    },
    { initialNumItems: numItems },
  );

  // 3. Fetch categories separately (not paginated as they are few)
  const categoriesData = useQuery(api.categories.getCategories);

  // 4. Map and Personalized Sort results per page
  const formattedData = useMemo(() => {
    // Map Convex courses to the Course type
    const mappedCourses: Course[] = results.map((course: any) => ({
      id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail || "/placeholders/course-thumbnail.jpg",
      image: course.thumbnail || "/placeholders/course-thumbnail.jpg",
      isPublic: course.isPublic,
      progress: 0,
      rating: course.rating || 0,
      enrolledCount: course.enrollmentCount || 0,
      lastAccessed: course.updatedAt,
      metadata: course.metadata || {},
      tags: course.tags || [],
      sections: course.sections || [],
      totalLessons:
        course.sections?.reduce(
          (total: number, section: any) =>
            total + (section.lessons?.length || 0),
          0,
        ) || 0,
      duration: course.estimatedDuration,
    }));

    // Results are already filtered by server, so we only handle personalization sort here
    let processed = [...mappedCourses];

    // Apply Personalization Weight within the page
    const interestedSet = new Set(
      options.interestedCategories?.map((c) => c.toLowerCase()) || [],
    );

    processed.sort((a, b) => {
      const aMatch = interestedSet.has(a.category?.toLowerCase() || "");
      const bMatch = interestedSet.has(b.category?.toLowerCase() || "");

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0; // Maintain base query order for rest
    });

    const formattedCategories =
      categoriesData?.map((cat) => ({
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, "-"),
        courseCount: results.filter((c: any) => c.category === cat.name).length,
      })) || [];

    return {
      courses: processed,
      categories: formattedCategories,
      loading: status === "LoadingFirstPage",
      loadingMore: status === "LoadingMore",
      hasMore: status === "CanLoadMore",
      totalCount: mappedCourses.length, // Only count of current items for UI
      currentCategory,
      error: null,
    };
  }, [
    results,
    status,
    categoriesData,
    currentCategory,
    options.interestedCategories,
  ]);

  return {
    ...formattedData,
    loadMore: () => loadMore(numItems),
  };
}
