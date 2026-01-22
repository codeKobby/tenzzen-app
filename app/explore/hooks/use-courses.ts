"use client";

import { Course } from "@/app/courses/types";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";

interface UseCoursesOptions {
  limit?: number;
  page?: number;
  category?: string;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
}

export function useCourses(options: UseCoursesOptions = {}) {
  // Use Convex query to get public courses
  const publicCoursesData = useQuery(api.courses.getPublicCourses);

  // Use Convex query to get categories
  const categoriesData = useQuery(api.categories.getCategories);

  const formattedData = useMemo(() => {
    if (!publicCoursesData) {
      return {
        courses: [],
        categories: [],
        loading: true,
        error: null,
        totalCount: 0,
      };
    }

    // Map Convex courses to the Course type
    const mappedCourses: Course[] = publicCoursesData.map((course: any) => ({
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

    // Filter and sort client-side for this simple implementation
    // The main list should use useCategoryCourses which will be more robust
    let filteredCourses = [...mappedCourses];

    if (options.category && options.category !== "all") {
      filteredCourses = filteredCourses.filter(
        (c) => c.category?.toLowerCase() === options.category?.toLowerCase(),
      );
    }

    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filteredCourses = filteredCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    if (options.sortBy) {
      switch (options.sortBy) {
        case "enrollments":
          filteredCourses.sort(
            (a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0),
          );
          break;
        case "rating":
          filteredCourses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "recent":
          filteredCourses.sort(
            (a, b) =>
              new Date(b.lastAccessed || 0).getTime() -
              new Date(a.lastAccessed || 0).getTime(),
          );
          break;
      }
    }

    // Apply pagination
    const limit = options.limit || 100;
    const page = options.page || 1;
    const paginatedCourses = filteredCourses.slice(
      (page - 1) * limit,
      page * limit,
    );

    return {
      courses: paginatedCourses,
      categories: categoriesData?.map((c) => c.name) || [],
      loading: false,
      error: null,
      totalCount: filteredCourses.length,
    };
  }, [
    publicCoursesData,
    categoriesData,
    options.category,
    options.searchQuery,
    options.sortBy,
    options.limit,
    options.page,
  ]);

  return formattedData;
}
