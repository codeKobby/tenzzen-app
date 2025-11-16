'use client';

import { Course } from '@/app/courses/types';
import { useEffect, useState, useRef } from 'react';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface UseUserCoursesOptions {
  limit?: number;
  page?: number;
  category?: string;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
}

export function useUserCourses(options: UseUserCoursesOptions = {}) {
  const { userId } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Query courses from Convex
  const convexCourses = useQuery(
    api.courses.getUserCourses,
    userId ? { userId } : 'skip'
  );

  // Debug logging
  React.useEffect(() => {
    console.log('[use-user-courses] userId:', userId);
    console.log('[use-user-courses] convexCourses:', convexCourses);
  }, [userId, convexCourses]);

  // Loading state based on Convex query
  const loading = convexCourses === undefined;

  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Set up the cleanup function for component unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;

    async function processConvexCourses() {
      try {
        // Check if we have userId and data
        if (!userId || !convexCourses) {
          setCourses([]);
          setRecentCourses([]);
          setCategories([]);
          setTotalCount(0);
          setError(null);
          return;
        }

        // Transform Convex courses to the Course type expected by the UI
        const formattedCourses: Course[] = convexCourses.map((course: any) => {
          // Calculate progress and completion status
          const totalLessons = course.modules?.reduce(
            (total: number, module: any) => total + (module.lessons?.length || 0),
            0
          ) || 0;

          const completedLessons = 0; // TODO: Get from enrollments when implemented
          const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

          return {
            id: course._id,
            title: course.title || "Untitled Course",
            description: course.description || "",
            image: course.thumbnail || "/placeholders/course-thumbnail.jpg",
            thumbnail: course.thumbnail || "/placeholders/course-thumbnail.jpg",
            videoId: course.sourceId || "",
            progress: progress,
            lastAccessed: course.updatedAt || course.createdAt,
            enrolledAt: course.createdAt,
            isEnrolled: true,
            category: course.category || "all",
            tags: course.tags || [],
            metadata: course.metadata || {},
            completedLessons: [],
            duration: course.estimatedDuration || undefined,
            estimatedHours: course.estimatedHours || undefined,
            sections: course.modules || [],
            totalLessons: totalLessons,
            lessonsCompleted: completedLessons,
          };
        });

        // Apply filters
        let filteredCourses = [...formattedCourses];

        // Apply category filter
        if (options.category && options.category !== 'all') {
          filteredCourses = filteredCourses.filter(
            course => course.category === options.category
          );
        }

        // Apply search query
        if (options.searchQuery && options.searchQuery.trim() !== '') {
          const searchTerm = options.searchQuery.toLowerCase().trim();
          filteredCourses = filteredCourses.filter(course =>
            course.title.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm)
          );
        }

        // Apply status filter
        if (options.filter) {
          switch (options.filter) {
            case 'in-progress':
              filteredCourses = filteredCourses.filter(
                course => course.progress > 0 && course.progress < 100
              );
              break;
            case 'completed':
              filteredCourses = filteredCourses.filter(
                course => course.progress === 100
              );
              break;
            case 'not-started':
              filteredCourses = filteredCourses.filter(
                course => course.progress === 0
              );
              break;
          }
        }

        // Apply sorting
        if (options.sortBy) {
          switch (options.sortBy) {
            case 'title':
              filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
              break;
            case 'lastAccessed':
              filteredCourses.sort((a, b) => {
                const dateA = new Date(a.lastAccessed || 0).getTime();
                const dateB = new Date(b.lastAccessed || 0).getTime();
                return dateB - dateA;
              });
              break;
            case 'progress':
              filteredCourses.sort((a, b) => b.progress - a.progress);
              break;
            case 'recentlyAdded':
              filteredCourses.sort((a, b) => {
                const dateA = new Date(a.enrolledAt || 0).getTime();
                const dateB = new Date(b.enrolledAt || 0).getTime();
                return dateB - dateA;
              });
              break;
            default:
              // Default to recently added
              filteredCourses.sort((a, b) => {
                const dateA = new Date(a.enrolledAt || 0).getTime();
                const dateB = new Date(b.enrolledAt || 0).getTime();
                return dateB - dateA;
              });
          }
        }

        // Apply pagination
        if (options.limit && options.page) {
          const start = (options.page - 1) * options.limit;
          const end = start + options.limit;
          filteredCourses = filteredCourses.slice(start, end);
        }

        // Set state
        setCourses(filteredCourses);
        setRecentCourses(filteredCourses.slice(0, 2));
        setTotalCount(filteredCourses.length);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(formattedCourses.map(course => course.category))
        ).filter(Boolean);
        setCategories(uniqueCategories);

        setError(null);
      } catch (err) {
        console.error('Error processing courses:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to process courses';
        setError(errorMessage);
        setCourses([]);
        setRecentCourses([]);
        setCategories([]);
        setTotalCount(0);
      }
    }

    processConvexCourses();
  }, [
    userId,
    convexCourses,
    options.category,
    options.limit,
    options.page,
    options.sortBy,
    options.filter,
    options.searchQuery,
  ]);

  return {
    courses,
    recentCourses,
    categories,
    loading,
    error,
    totalCount,
  };
}
