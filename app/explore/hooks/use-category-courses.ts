'use client';

import { useSupabase } from '@/contexts/supabase-context';
import { Course } from '@/app/courses/types';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { normalizeCategory } from '@/app/utils/category-utils';
import { debounce } from 'lodash';

interface CategoryCourseCache {
  courses: Course[];
  hasMore: boolean;
  page: number;
  totalCount: number;
  isLoaded: boolean;
}

interface UseCategoryCoursesOptions {
  limit?: number;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
  initialCategory?: string;
}

export function useCategoryCourses(options: UseCategoryCoursesOptions = {}) {
  const supabase = useSupabase();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current category from URL or use initialCategory
  const currentCategory = searchParams.get('category') || options.initialCategory || 'all';

  // State for courses and loading
  const [courses, setCourses] = useState<Course[]>([]);
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

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, course_count')
          .order('course_count', { ascending: false });

        if (error) throw error;

        const mappedCategories = data.map(category => ({
          name: category.name,
          slug: category.slug,
          courseCount: category.course_count
        }));

        setCategories(mappedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }

    fetchCategories();
  }, [supabase]);

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
    if (!supabase) return;

    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      // Check if we have cached data for this category and page
      const cache = categoryCache.current[category];
      if (cache && pageNum <= cache.page) {
        // Calculate how many courses to display based on the page
        const coursesToDisplay = cache.courses.slice(0, pageNum * (options.limit || 12));
        setCourses(coursesToDisplay);
        setTotalCount(cache.totalCount);
        setHasMore(cache.hasMore);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

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
      if (category && category !== 'all') {
        try {
          console.log(`Filtering by category: ${category}`);

          // Use a two-step approach for category filtering
          // Step 1: Get the category ID from the slug
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('id, name')
            .eq('slug', category)
            .single();

          if (categoryError) {
            console.error('Error fetching category by slug:', categoryError);

            // Try a more flexible approach - look for similar slugs
            console.log(`Trying to find category with similar slug to: ${category}`);
            const normalizedSlug = category.toLowerCase().replace(/[^a-z0-9]/g, '%');

            const { data: similarCategories, error: similarError } = await supabase
              .from('categories')
              .select('id, name, slug')
              .ilike('slug', `%${normalizedSlug}%`)
              .limit(1);

            if (similarError || !similarCategories || similarCategories.length === 0) {
              console.error('No similar categories found:', similarError || 'No results');

              // As a last resort, try to filter by category name directly in the courses table
              console.log('Falling back to direct category filtering on courses table');
              const normalizedCategoryName = category.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');

              query = query.ilike('category', `%${normalizedCategoryName}%`);
              return; // Skip the course_categories join approach
            }

            // Use the first similar category found
            const similarCategory = similarCategories[0];
            console.log(`Found similar category: ${similarCategory.name} (${similarCategory.slug})`);

            // Step 2: Get course IDs for this category
            const { data: courseCategoryData, error: courseCategoryError } = await supabase
              .from('course_categories')
              .select('course_id')
              .eq('category_id', similarCategory.id);

            if (courseCategoryError) {
              console.error('Error fetching course categories:', courseCategoryError);
              // Fall back to direct filtering
              query = query.ilike('category', `%${similarCategory.name}%`);
              return;
            }

            // Step 3: Filter courses by these IDs
            const courseIds = courseCategoryData.map(item => item.course_id);
            if (courseIds.length > 0) {
              console.log(`Found ${courseIds.length} courses in similar category`);
              query = query.in('id', courseIds);
            } else {
              console.log('No courses found in similar category, falling back to direct filtering');
              query = query.ilike('category', `%${similarCategory.name}%`);
            }

            return;
          }

          if (!categoryData) {
            console.log('Category not found in database, using direct filtering');
            // No category found, try direct filtering instead of returning empty
            const normalizedCategoryName = category.split('-').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');

            query = query.ilike('category', `%${normalizedCategoryName}%`);
            return;
          }

          console.log(`Found category in database: ${categoryData.name} (ID: ${categoryData.id})`);

          // Step 2: Get course IDs for this category
          const { data: courseCategoryData, error: courseCategoryError } = await supabase
            .from('course_categories')
            .select('course_id')
            .eq('category_id', categoryData.id);

          if (courseCategoryError) {
            console.error('Error fetching course categories:', courseCategoryError);
            // Fall back to direct filtering
            const normalizedCategoryName = category.split('-').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');

            query = query.ilike('category', `%${normalizedCategoryName}%`);
            return;
          }

          // Step 3: Filter courses by these IDs
          const courseIds = courseCategoryData.map(item => item.course_id);
          if (courseIds.length > 0) {
            console.log(`Found ${courseIds.length} courses in category`);
            query = query.in('id', courseIds);
          } else {
            console.log('No courses found in category via join table, falling back to direct filtering');
            // Try direct filtering instead of returning empty
            const normalizedCategoryName = category.split('-').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');

            query = query.ilike('category', `%${normalizedCategoryName}%`);
          }
        } catch (err) {
          console.error('Error in category filtering:', err);
          // Fall back to a simple approach in case of errors
          const normalizedCategoryName = category.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');

          query = query.ilike('category', `%${normalizedCategoryName}%`);
        }
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
      const start = 0; // Always fetch from the beginning to build the cache
      const end = pageNum * pageSize - 1; // Fetch all pages up to the current one

      query = query.range(start, end);

      // Execute the query
      const { data, error, count } = await query;

      if (error) throw error;

      if (!data) {
        setCourses([]);
        setTotalCount(0);
        setHasMore(false);
        return;
      }

      // Process the courses
      const mappedCourses = data.map(course => {
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

        // Normalize the category
        const normalizedCategory = normalizeCategory(
          course.category || '',
          Array.isArray(course.tags) ? course.tags : []
        );

        return {
          id: course.id,
          title: course.title || 'Untitled Course',
          description: course.description || '',
          image: course.thumbnail || '/placeholders/course-thumbnail.jpg',
          thumbnail: course.thumbnail || '/placeholders/course-thumbnail.jpg',
          videoId: course.video_id || '',
          progress: 0,
          category: normalizedCategory,
          tags: Array.isArray(course.tags) ? course.tags : [],
          rating: course.avg_rating || 0,
          enrolledCount: course.enrollment_count || 0,
          lastAccessed: course.updated_at,
          metadata: course.metadata,
          sections: sections,
          totalLessons: totalLessons,
          estimated_duration: course.estimated_duration
        };
      });

      // Update the cache
      categoryCache.current[category] = {
        courses: mappedCourses,
        hasMore: count ? mappedCourses.length < count : false,
        page: pageNum,
        totalCount: count || 0,
        isLoaded: true
      };

      setCourses(mappedCourses);
      setTotalCount(count || 0);
      setHasMore(count ? mappedCourses.length < count : false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      let errorMessage = 'Failed to fetch courses';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = `Error fetching courses: ${JSON.stringify(err)}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [supabase, options.limit, options.sortBy, options.filter, options.searchQuery]);

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
      setCourses(cachedData.courses);
      setTotalCount(cachedData.totalCount);
      setHasMore(cachedData.hasMore);
      setPage(cachedData.page);
    }
    // If we don't have this category loaded or it's not in cache, fetch it
    else if (categoryChanged || !isCategoryInCache) {
      console.log(`Fetching new data for category ${currentCategory}`);
      // If we don't have this category loaded, show loading state and fetch
      setCourses([]);
      setTotalCount(0);
      setHasMore(true);
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
  }, [currentCategory, page, fetchCourses]);

  return {
    courses,
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
