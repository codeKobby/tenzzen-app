'use client';

// TODO: Migrate to Convex
import { Course } from '@/app/courses/types';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { normalizeCategory } from '@/app/utils/category-utils';
import { extractCourseSections } from '@/lib/course-utils';
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current category from URL or use initialCategory
  const currentCategory = searchParams.get('category') || options.initialCategory || 'all';

  // State for courses and loading
  const [allCourses, setAllCourses] = useState<Course[]>([]); // Store all courses
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]); // Store filtered courses
  const [categories, setCategories] = useState<Array<{name: string, slug: string, courseCount: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allCoursesLoaded, setAllCoursesLoaded] = useState(false);

  // Cache for pagination to avoid refetching
  const paginationCache = useRef<{
    page: number;
    hasMore: boolean;
    totalCount: number;
  }>({
    page: 1,
    hasMore: true,
    totalCount: 0
  });

  // Current page for pagination
  const [page, setPage] = useState(1);

  // Fetch categories from all available courses
  useEffect(() => {
    async function fetchCategories() {
      if (!supabase) return;

      try {
        // First, get all public courses to extract categories
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, category, tags')
          .eq('is_public', true);

        if (coursesError) throw coursesError;

        // Extract and count categories from courses
        const categoryMap = new Map<string, number>();

        // Process each course
        coursesData.forEach(course => {
          // Get category from course data
          let category = course.category;

          // If no category, try to derive from tags
          if (!category && Array.isArray(course.tags) && course.tags.length > 0) {
            // Use first tag as category
            category = course.tags[0];
          }

          // Skip if no category found
          if (!category) return;

          // Normalize category name
          const normalizedCategory = category.trim();
          if (!normalizedCategory) return;

          // Count this category
          const count = categoryMap.get(normalizedCategory) || 0;
          categoryMap.set(normalizedCategory, count + 1);
        });

        // Convert to array and format for display
        const extractedCategories = Array.from(categoryMap.entries())
          .filter(([name, count]) => count > 0) // Only include categories with courses
          .map(([name, count]) => ({
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            courseCount: count
          }));

        // Deduplicate categories by slug
        const uniqueCategories = [];
        const slugs = new Set();

        extractedCategories.forEach(category => {
          if (!slugs.has(category.slug)) {
            slugs.add(category.slug);
            uniqueCategories.push(category);
          } else {
            // If duplicate found, combine the counts
            const existingCategory = uniqueCategories.find(c => c.slug === category.slug);
            if (existingCategory) {
              existingCategory.courseCount += category.courseCount;
            }
          }
        });

        // Sort by count (most courses first)
        uniqueCategories.sort((a, b) => b.courseCount - a.courseCount);

        setCategories(uniqueCategories);

        // Also try to get categories from the database as a fallback
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, course_count')
          .order('course_count', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge database categories with extracted ones
          const dbCategories = data.map(category => ({
            name: category.name,
            slug: category.slug,
            courseCount: category.course_count
          }));

          // Combine both sets of categories, ensuring uniqueness by slug
          const combinedCategories = [...uniqueCategories];
          const combinedSlugs = new Set(uniqueCategories.map(cat => cat.slug));

          // Add database categories that don't exist in extracted ones
          dbCategories.forEach(dbCat => {
            if (!combinedSlugs.has(dbCat.slug)) {
              combinedCategories.push(dbCat);
              combinedSlugs.add(dbCat.slug);
            } else {
              // If duplicate found, keep the one with the higher count
              const existingCategory = combinedCategories.find(c => c.slug === dbCat.slug);
              if (existingCategory && dbCat.courseCount > existingCategory.courseCount) {
                existingCategory.courseCount = dbCat.courseCount;
              }
            }
          });

          // Sort again by count
          combinedCategories.sort((a, b) => b.courseCount - a.courseCount);

          setCategories(combinedCategories);
        }
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

  // Function to fetch all courses
  const fetchCourses = useCallback(async (pageNum: number, isLoadingMore = false) => {
    if (!supabase) return;

    if (isLoadingMore) {
      setLoadingMore(true);
    } else if (!allCoursesLoaded) {
      setLoading(true);
    }

    setError(null);

    try {
      // If we've already loaded all courses and we're just loading more pages
      if (allCoursesLoaded && pageNum <= paginationCache.current.page) {
        // Apply client-side filtering based on the current category
        filterCoursesByCategory(allCourses, currentCategory, pageNum);
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
        setAllCourses([]);
        setFilteredCourses([]);
        setTotalCount(0);
        setHasMore(false);
        return;
      }

      // Process the courses
      const mappedCourses = data.map(course => {
        // Extract sections using our robust utility function
        const sections = extractCourseSections(course);

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

      // Update pagination cache
      paginationCache.current = {
        page: pageNum,
        hasMore: count ? mappedCourses.length < count : false,
        totalCount: count || 0
      };

      // Store all courses
      setAllCourses(mappedCourses);
      setAllCoursesLoaded(true);

      // Apply client-side filtering based on the current category
      filterCoursesByCategory(mappedCourses, currentCategory, pageNum);

      // Update total count
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
  }, [supabase, options.limit, options.sortBy, options.filter, options.searchQuery, allCourses, currentCategory, allCoursesLoaded]);

  // Function to filter courses by category client-side
  const filterCoursesByCategory = useCallback((courses: Course[], category: string, pageNum: number) => {
    if (!courses || courses.length === 0) {
      setFilteredCourses([]);
      return;
    }

    let filtered = [...courses];
    const pageSize = options.limit || 12;

    // Apply category filter if not "all"
    if (category && category !== 'all') {
      if (category === 'recommended') {
        // For recommended courses, use the top courses by enrollment count
        filtered = [...courses].sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0)).slice(0, 12);
      } else {
        // Filter by normalized category slug
        const normalizedCategoryName = category.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        filtered = courses.filter(course => {
          // Check if course category matches (case insensitive)
          const courseCategory = course.category?.toLowerCase() || '';
          const searchCategory = normalizedCategoryName.toLowerCase();

          // Check direct match or partial match
          return courseCategory === searchCategory ||
                 courseCategory.includes(searchCategory) ||
                 searchCategory.includes(courseCategory) ||
                 // Also check tags
                 course.tags.some(tag =>
                   tag.toLowerCase().includes(searchCategory) ||
                   searchCategory.includes(tag.toLowerCase())
                 );
        });
      }
    }

    // Apply pagination to filtered results
    const paginatedResults = filtered.slice(0, pageNum * pageSize);

    // Update state with filtered courses
    setFilteredCourses(paginatedResults);
    setTotalCount(filtered.length);
    setHasMore(paginatedResults.length < filtered.length);

  }, [options.limit]);

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

  // Effect to handle category changes and pagination
  useEffect(() => {
    // Check if category has changed
    const categoryChanged = prevCategoryRef.current !== currentCategory;

    // Log for debugging
    console.log(`Category changed from ${prevCategoryRef.current} to ${currentCategory}`);

    // Update the previous category ref
    prevCategoryRef.current = currentCategory;

    if (allCoursesLoaded) {
      // If all courses are loaded, just filter client-side
      console.log(`Filtering courses client-side for category: ${currentCategory}`);
      filterCoursesByCategory(allCourses, currentCategory, page);
    } else {
      // If courses aren't loaded yet, fetch them
      console.log(`Fetching all courses for initial load`);
      fetchCourses(1, false);
    }
  }, [currentCategory, allCoursesLoaded, allCourses, filterCoursesByCategory]);

  // Effect to handle pagination
  useEffect(() => {
    // Only handle pagination if we've already loaded the initial data
    if (allCoursesLoaded && page > 1) {
      console.log(`Loading more courses for page ${page}`);
      // Apply client-side filtering with the new page number
      filterCoursesByCategory(allCourses, currentCategory, page);
    }
  }, [page, allCoursesLoaded, allCourses, currentCategory, filterCoursesByCategory]);

  return {
    courses: filteredCourses,
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
