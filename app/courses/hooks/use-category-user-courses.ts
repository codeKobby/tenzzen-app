'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

interface UseCategoryUserCoursesOptions {
  limit?: number;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
  initialCategory?: string;
}

export function useCategoryUserCourses(options: UseCategoryUserCoursesOptions = {}) {
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current category from URL or use initialCategory
  const currentCategory = searchParams.get('category') || options.initialCategory || 'all';

  // Fetch user's created courses directly
  const userCourses = useQuery(
    api.courses.getUserCourses,
    user?.id ? { userId: user.id } : 'skip'
  );

  // Debug logging
  useEffect(() => {
    console.log('[useCategoryUserCourses] user?.id:', user?.id);
    console.log('[useCategoryUserCourses] userCourses:', userCourses);
  }, [user?.id, userCourses]);

  // Transform courses to the format expected by components
  const courses = userCourses ? userCourses.map(course => ({
    id: course._id,
    title: course.title,
    description: course.description,
    progress: 0, // TODO: Get progress from enrollments
    thumbnail: course.sourceUrl || '/placeholders/course-thumbnail.jpg',
    image: course.sourceUrl || '/placeholders/course-thumbnail.jpg',
    category: course.categoryId ? 'Category' : 'Uncategorized', // TODO: Fetch actual category name
    enrolledAt: course.createdAt,
    lastAccessed: course.updatedAt || course.createdAt,
    tags: [], // TODO: Add tags support when available in schema
    videoId: course.sourceId || '',
    isEnrolled: true, // User created it, so they're "enrolled"
    metadata: {},
    completedLessons: [],
    duration: course.estimatedDuration,
    sections: [],
    totalLessons: 0,
    lessonsCompleted: 0,
  })) : [];

  // Filter courses by category
  const filteredCourses = courses.filter(course => {
    if (currentCategory === 'all') return true;
    return course.category === currentCategory;
  });

  // Get recent courses (last 2)
  const recentCourses = filteredCourses.slice(0, 2);

  // Get unique categories from courses
  const categoryMap = new Map<string, number>();
  courses.forEach(course => {
    const cat = course.category || 'Uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });

  const categories = [
    { name: 'All Courses', slug: 'all', courseCount: courses.length },
    ...Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      courseCount: count
    }))
  ];

  // Load more functionality (simplified)
  const loadMore = useCallback(() => {
    // TODO: Implement pagination
  }, []);

  return {
    courses: filteredCourses,
    recentCourses,
    categories,
    loading: userCourses === undefined,
    loadingMore: false,
    error: null,
    totalCount: filteredCourses.length,
    hasMore: false, // TODO: Implement pagination
    currentCategory,
    loadMore
  };
}
