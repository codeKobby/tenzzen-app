'use client';

import { useSupabase } from '@/contexts/supabase-context';
import { Course } from '@/app/courses/types';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { normalizeCategory } from '@/app/utils/category-utils';
import { useAuth, useSession } from '@clerk/nextjs';
import { debounce } from 'lodash';

interface CategoryCourseCache {
  courses: Course[];
  hasMore: boolean;
  page: number;
  totalCount: number;
  isLoaded: boolean;
}

interface UseCategoryUserCoursesOptions {
  limit?: number;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
  initialCategory?: string;
}

export function useCategoryUserCourses(options: UseCategoryUserCoursesOptions = {}) {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const { session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current category from URL or use initialCategory
  const currentCategory = searchParams.get('category') || options.initialCategory || 'all';

  // State for courses and loading
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Array<{name: string, slug: string, courseCount: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Cache for each category to avoid refetching
  const categoryCache = useRef<Record<string, CategoryCourseCache>>({});

  // Current page for pagination
  const [page, setPage] = useState(1);

  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Safe state update functions that check if component is still mounted
  const safeSetCourses = (data: Course[]) => {
    if (isMounted.current) setCourses(data);
  };

  const safeSetRecentCourses = (data: Course[]) => {
    if (isMounted.current) setRecentCourses(data);
  };

  const safeSetCategories = (data: Array<{name: string, slug: string, courseCount: number}>) => {
    if (isMounted.current) setCategories(data);
  };

  const safeSetLoading = (isLoading: boolean) => {
    if (isMounted.current) setLoading(isLoading);
  };

  const safeSetLoadingMore = (isLoading: boolean) => {
    if (isMounted.current) setLoadingMore(isLoading);
  };

  const safeSetError = (errorMsg: string | null) => {
    if (isMounted.current) setError(errorMsg);
  };

  const safeSetTotalCount = (count: number) => {
    if (isMounted.current) setTotalCount(count);
  };

  const safeSetHasMore = (more: boolean) => {
    if (isMounted.current) setHasMore(more);
  };

  // Set up the cleanup function for component unmount
  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      if (!supabase) return;

      try {
        // First get user's enrolled courses to extract categories
        if (!userId) return;

        // Get the Supabase user ID from the Clerk ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', userId)
          .single();

        if (userError) {
          console.error('Error getting user:', userError);
          // Set empty categories but don't show error to user
          safeSetCategories([]);
          return;
        }

        // Get all user enrollments to extract categories
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            courses (
              category,
              tags
            )
          `)
          .eq('user_id', userData.id);

        if (enrollmentsError) {
          console.error('Error getting enrollments:', enrollmentsError);
          // Set empty categories but don't show error to user
          safeSetCategories([]);
          return;
        }

        // If no enrollments, set empty categories
        if (!enrollments || enrollments.length === 0) {
          safeSetCategories([]);
          return;
        }

        // Extract and normalize categories
        const categoryMap = new Map<string, number>();

        enrollments.forEach(enrollment => {
          if (enrollment.courses) {
            const normalizedCategory = normalizeCategory(
              enrollment.courses.category || '',
              Array.isArray(enrollment.courses.tags) ? enrollment.courses.tags : []
            );

            if (normalizedCategory) {
              const count = categoryMap.get(normalizedCategory) || 0;
              categoryMap.set(normalizedCategory, count + 1);
            }
          }
        });

        // Convert to array and format for display
        const userCategories = Array.from(categoryMap.entries()).map(([name, count]) => ({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          courseCount: count
        }));

        // Sort by count
        userCategories.sort((a, b) => b.courseCount - a.courseCount);

        safeSetCategories(userCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Set empty categories but don't show error to user
        safeSetCategories([]);
      }
    }

    fetchCategories();
  }, [supabase, userId]);

  // Helper function to get formatted category name for display
  const getCategoryDisplayName = (slug: string): string => {
    if (slug === 'all') return 'All Courses';

    const category = categories.find(cat => cat.slug === slug);
    return category ? category.name : slug.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Function to fetch courses for a specific category and page
  const fetchCourses = useCallback(async (category: string, pageNum: number, isLoadingMore = false) => {
    if (!supabase || !userId) return;

    if (isLoadingMore) {
      safeSetLoadingMore(true);
    } else {
      safeSetLoading(true);
    }

    safeSetError(null);

    try {
      // Check if we have cached data for this category and page
      const cache = categoryCache.current[category];
      if (cache && pageNum <= cache.page) {
        // Calculate how many courses to display based on the page
        const coursesToDisplay = cache.courses.slice(0, pageNum * (options.limit || 12));
        safeSetCourses(coursesToDisplay);
        safeSetRecentCourses(coursesToDisplay.slice(0, 2));
        safeSetTotalCount(cache.totalCount);
        safeSetHasMore(cache.hasMore);
        safeSetLoading(false);
        safeSetLoadingMore(false);
        return;
      }

      // Get the Supabase user ID from the Clerk ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (userError) {
        console.error('Error getting user:', userError);
        safeSetError('Error getting user data');
        safeSetLoading(false);
        safeSetLoadingMore(false);
        return;
      }

      // Start building the query
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          enrolled_at,
          last_accessed_at,
          progress,
          completion_status,
          completed_lessons,
          courses (
            id,
            title,
            description,
            thumbnail,
            video_id,
            metadata,
            tags,
            category,
            estimated_hours,
            estimated_duration::text
          )
        `, { count: 'exact' })
        .eq('user_id', userData.id);

      // Apply category filter if provided
      if (category && category !== 'all') {
        // Find the category in our list of categories
        const categoryObj = categories.find(cat => cat.slug === category);

        if (categoryObj) {
          console.log(`Found category in list: ${categoryObj.name}`);
          // Filter by the category name
          query = query.eq('courses.category', categoryObj.name);
        } else {
          // If category not found in our list, try to normalize the slug
          const normalizedCategoryName = category.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');

          console.log(`Category not found in list, using normalized name: ${normalizedCategoryName}`);

          // Use ilike for case-insensitive matching instead of exact match
          query = query.ilike('courses.category', `%${normalizedCategoryName}%`);

          // Also try to match against tags as a fallback
          // query = query.or(`courses.tags.cs.{${normalizedCategoryName.toLowerCase()}}`);
        }
      }

      // Apply search query if provided
      if (options.searchQuery && options.searchQuery.trim() !== '') {
        const searchTerm = `%${options.searchQuery.toLowerCase()}%`;
        query = query.or(`courses.title.ilike.${searchTerm},courses.description.ilike.${searchTerm}`);
      }

      // Apply filter based on progress
      if (options.filter) {
        switch (options.filter) {
          case 'in-progress':
            query = query.gt('progress', 0).lt('progress', 100);
            break;
          case 'completed':
            query = query.eq('progress', 100);
            break;
          case 'not-started':
            query = query.eq('progress', 0);
            break;
        }
      }

      // Apply sorting
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'title':
            // Can't sort by courses.title directly in the query
            // We'll sort after fetching
            query = query.order('enrolled_at', { ascending: false });
            break;
          case 'lastAccessed':
            query = query.order('last_accessed_at', { ascending: false });
            break;
          case 'progress':
            query = query.order('progress', { ascending: false });
            break;
          case 'recentlyAdded':
            query = query.order('enrolled_at', { ascending: false });
            break;
          default:
            // Default to recently added
            query = query.order('enrolled_at', { ascending: false });
        }
      } else {
        // Default sorting by recently added
        query = query.order('enrolled_at', { ascending: false });
      }

      // Apply pagination
      const pageSize = options.limit || 12;
      const start = 0; // Always fetch from the beginning to build the cache
      const end = pageNum * pageSize - 1; // Fetch all pages up to the current one

      query = query.range(start, end);

      // Execute the query
      const { data: enrollments, error: enrollmentsError, count } = await query;

      if (enrollmentsError) {
        console.error('Error getting enrollments:', enrollmentsError);
        safeSetError('Error loading your courses');
        safeSetLoading(false);
        safeSetLoadingMore(false);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        safeSetCourses([]);
        safeSetRecentCourses([]);
        safeSetTotalCount(0);
        safeSetHasMore(false);
        safeSetLoading(false);
        safeSetLoadingMore(false);
        return;
      }

      // Format enrollments into courses
      const formattedEnrollments = enrollments
        .filter(enrollment => enrollment.courses) // Filter out enrollments without course data
        .map(enrollment => {
          const course = enrollment.courses;

          // Normalize the category
          const normalizedCategory = normalizeCategory(
            course.category || '',
            Array.isArray(course.tags) ? course.tags : []
          );

          // Extract sections from metadata.courseItems if available
          const sections = (() => {
            if (course.metadata?.courseItems && Array.isArray(course.metadata.courseItems)) {
              return course.metadata.courseItems
                .filter((item: any) => item.type === 'section')
                .map((section: any) => ({
                  title: section.title || 'Untitled Section',
                  lessons: Array.isArray(section.lessons) ? section.lessons : []
                }));
            }
            return [];
          })();

          // Calculate total lessons
          const totalLessons = sections.reduce(
            (total: number, section: any) => total + (section.lessons?.length || 0),
            0
          );

          return {
            id: enrollment.course_id,
            title: course.title || 'Untitled Course',
            description: course.description || '',
            image: course.thumbnail || '/placeholders/course-thumbnail.jpg',
            thumbnail: course.thumbnail || '/placeholders/course-thumbnail.jpg',
            videoId: course.video_id || '',
            progress: enrollment.progress || 0,
            lastAccessed: enrollment.last_accessed_at,
            enrolledAt: enrollment.enrolled_at,
            isEnrolled: true,
            category: normalizedCategory,
            tags: course.tags || [],
            metadata: course.metadata || {},
            completedLessons: enrollment.completed_lessons || [],
            duration: course.estimated_hours ? `${course.estimated_hours}h` : undefined,
            estimatedHours: course.estimated_hours || undefined,
            durationMinutes: course.duration_minutes || undefined,
            estimated_duration: course.estimated_duration || undefined,
            sections: sections,
            totalLessons: totalLessons,
            lessonsCompleted: enrollment.completed_lessons?.length || 0,
          };
        });

      // Apply client-side sorting if needed
      let sortedEnrollments = [...formattedEnrollments];
      if (options.sortBy === 'title') {
        sortedEnrollments.sort((a, b) => a.title.localeCompare(b.title));
      }

      // Update the cache
      categoryCache.current[category] = {
        courses: sortedEnrollments,
        hasMore: count ? sortedEnrollments.length < count : false,
        page: pageNum,
        totalCount: count || 0,
        isLoaded: true
      };

      safeSetCourses(sortedEnrollments);
      safeSetRecentCourses(sortedEnrollments.slice(0, 2));
      safeSetTotalCount(count || 0);
      safeSetHasMore(count ? sortedEnrollments.length < count : false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      let errorMessage = 'Failed to fetch courses';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = `Error fetching courses: ${JSON.stringify(err)}`;
      }
      safeSetError(errorMessage);
    } finally {
      safeSetLoading(false);
      safeSetLoadingMore(false);
    }
  }, [supabase, userId, options.limit, options.sortBy, options.filter, options.searchQuery]);

  // Load more courses
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    setPage(prev => prev + 1);
  }, [loading, loadingMore, hasMore]);

  // Debounced version of loadMore to prevent too many calls
  const debouncedLoadMore = useCallback(
    debounce(() => loadMore(), 300),
    [loadMore]
  );

  // Track the previous category for debugging
  const prevCategoryRef = useRef<string | null>(null);

  // Effect to fetch courses when category or page changes
  useEffect(() => {
    // Check if we have this category in cache
    const isCategoryInCache = categoryCache.current[currentCategory];
    const isCategoryLoaded = isCategoryInCache && categoryCache.current[currentCategory].isLoaded;

    // Check if category has changed
    const categoryChanged = prevCategoryRef.current !== currentCategory;

    // Log for debugging
    console.log(`Category changed from ${prevCategoryRef.current} to ${currentCategory}`, {
      isCategoryInCache,
      isCategoryLoaded,
      categoryChanged,
      cacheKeys: Object.keys(categoryCache.current)
    });

    // Update the previous category ref
    prevCategoryRef.current = currentCategory;

    // If we already have this category loaded, use the cached data without showing loading state
    if (isCategoryLoaded) {
      console.log(`Using cached data for category ${currentCategory}`);
      const cachedData = categoryCache.current[currentCategory];
      safeSetCourses(cachedData.courses);
      safeSetRecentCourses(cachedData.courses.slice(0, 2));
      safeSetTotalCount(cachedData.totalCount);
      safeSetHasMore(cachedData.hasMore);
      setPage(cachedData.page);
    }
    // If we don't have this category loaded or it's not in cache, fetch it
    else if (categoryChanged || !isCategoryInCache) {
      console.log(`Fetching new data for category ${currentCategory}`);
      // If we don't have this category loaded, show loading state and fetch
      safeSetCourses([]);
      safeSetRecentCourses([]);
      safeSetTotalCount(0);
      safeSetHasMore(true);
      setPage(1);

      // Preserve cache for other categories
      if (categoryChanged) {
        // Only clear cache for categories we don't have loaded
        const newCache = {};
        Object.keys(categoryCache.current).forEach(key => {
          if (categoryCache.current[key].isLoaded) {
            newCache[key] = categoryCache.current[key];
          }
        });
        categoryCache.current = newCache;
      }

      fetchCourses(currentCategory, 1, false);
    }
    // Handle pagination (loading more)
    else {
      console.log(`Loading more for category ${currentCategory}, page ${page}`);
      const isLoadingMore = page > 1;
      fetchCourses(currentCategory, page, isLoadingMore);
    }
  }, [currentCategory, page, fetchCourses, session]);

  return {
    courses,
    recentCourses,
    categories,
    loading,
    loadingMore,
    error,
    totalCount,
    hasMore,
    currentCategory,
    loadMore: debouncedLoadMore
  };
}
