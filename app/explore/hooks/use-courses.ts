'use client';

import { useSupabase } from '@/contexts/supabase-context';
import { Course } from '@/app/courses/types';
import { useEffect, useState } from 'react';
import { normalizeCategory } from '@/app/utils/category-utils';

interface UseCourseOptions {
  limit?: number;
  page?: number;
  category?: string;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
}

export function useCourses(options: UseCourseOptions = {}) {
  const supabase = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setError(null);

      try {
        // Start building the query
        let query = supabase
          .from('courses')
          .select(`
            *,
            estimated_duration::text
          `, { count: 'exact' });

        // Filter by public courses
        query = query.eq('is_public', true);

        // Apply category filter if provided
        if (options.category && options.category !== 'all') {
          // Use the new course_categories junction table
          query = query.in('id',
            supabase
              .from('course_categories')
              .select('course_id')
              .in('category_id',
                supabase
                  .from('categories')
                  .select('id')
                  .eq('slug', options.category)
              )
          );
        }

        // Apply search query if provided
        if (options.searchQuery && options.searchQuery.trim() !== '') {
          const searchTerm = `%${options.searchQuery.toLowerCase()}%`;
          query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
        }

        // Apply additional filters
        if (options.filter) {
          switch (options.filter) {
            case 'popular':
              query = query.gte('enrollment_count', 1000);
              break;
            case 'highly-rated':
              query = query.gte('avg_rating', 4.5);
              break;
            case 'new':
              // Assuming created_at is within the last 30 days
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              query = query.gte('created_at', thirtyDaysAgo.toISOString());
              break;
          }
        }

        // Apply sorting
        if (options.sortBy) {
          switch (options.sortBy) {
            case 'enrollments':
              query = query.order('enrollment_count', { ascending: false });
              break;
            case 'rating':
              query = query.order('avg_rating', { ascending: false });
              break;
            case 'recent':
              query = query.order('created_at', { ascending: false });
              break;
          }
        } else {
          // Default sorting by enrollment count
          query = query.order('enrollment_count', { ascending: false });
        }

        // Apply pagination
        const pageSize = options.limit || 12;
        const pageIndex = options.page || 1;
        const start = (pageIndex - 1) * pageSize;

        query = query.range(start, start + pageSize - 1);

        // Execute the query
        const { data, error, count } = await query;

        if (error) throw error;

        // Map the Supabase data to the Course type
        const mappedCourses: Course[] = data.map(course => {
          // Normalize the category using our utility
          const normalizedCategory = normalizeCategory(
            course.category || "",
            Array.isArray(course.tags) ? course.tags : []
          );

          // Extract sections from metadata.courseItems if available
          const sections = (() => {
            // First check if course.metadata?.courseItems exists
            if (course.metadata?.courseItems && Array.isArray(course.metadata.courseItems)) {
              return course.metadata.courseItems.map((item: any) => {
                if (item.type === 'section') {
                  return {
                    title: item.title || "Untitled Section",
                    lessons: Array.isArray(item.lessons) ? item.lessons.map((lesson: any) => ({
                      id: lesson.id || "",
                      title: lesson.title || "Untitled Lesson",
                      content: lesson.content || "",
                      duration: lesson.duration || 0,
                      videoId: lesson.videoId || "",
                      completed: false
                    })) : []
                  };
                }
                return null;
              }).filter(Boolean);
            }
            // Fallback to empty array if no sections found
            return [];
          })();

          // Calculate total lessons
          const totalLessons = sections.reduce(
            (total: number, section: any) => total + (section.lessons?.length || 0),
            0
          );

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            category: normalizedCategory, // Use the normalized category
            thumbnail: course.thumbnail,
            isPublic: course.is_public,
            progress: 0, // Default for public courses
            rating: course.avg_rating,
            enrolledCount: course.enrollment_count,
            // Map other fields as needed - store raw duration values for proper formatting
            duration: course.estimated_hours ? `${course.estimated_hours}h` : undefined,
            estimatedHours: course.estimated_hours || undefined,
            // Store duration in minutes for courses that have it
            durationMinutes: course.duration_minutes || undefined,
            // Store estimated_duration in seconds directly from the database
            estimated_duration: course.estimated_duration || undefined,
            lastAccessed: course.updated_at,
            // Add any additional fields from the database
            metadata: course.metadata,
            tags: Array.isArray(course.tags) ? course.tags : [],
            sections: sections,
            totalLessons: totalLessons,
          };
        });

        setCourses(mappedCourses);
        setTotalCount(count || 0);

        // Fetch categories from the new categories table
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('name, slug, course_count')
          .gt('course_count', 0)
          .order('course_count', { ascending: false });

        if (categoryError) throw categoryError;

        // Extract category names
        const categoryNames = categoryData.map(item => item.name);

        setCategories(categoryNames);
      } catch (err) {
        console.error('Error fetching courses:', err);
        // Provide more detailed error information
        let errorMessage = 'Failed to fetch courses';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = `Error fetching courses: ${JSON.stringify(err)}`;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [
    supabase,
    options.category,
    options.limit,
    options.page,
    options.sortBy,
    options.filter,
    options.searchQuery,
  ]);

  return {
    courses,
    categories,
    loading,
    error,
    totalCount,
  };
}
