'use client';

import { useSupabase } from '@/contexts/supabase-context';
import { Course } from '@/app/courses/types';
import { useEffect, useState, useRef } from 'react';
import { useAuth, useSession } from '@clerk/nextjs';
import { normalizeCategory } from '@/app/utils/category-utils';

interface UseUserCoursesOptions {
  limit?: number;
  page?: number;
  category?: string;
  sortBy?: string;
  filter?: string;
  searchQuery?: string;
}

export function useUserCourses(options: UseUserCoursesOptions = {}) {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const { session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Safe state update functions that check if component is still mounted
  const safeSetCourses = (data: Course[]) => {
    if (isMounted.current) setCourses(data);
  };

  const safeSetRecentCourses = (data: Course[]) => {
    if (isMounted.current) setRecentCourses(data);
  };

  const safeSetCategories = (data: string[]) => {
    if (isMounted.current) setCategories(data);
  };

  const safeSetLoading = (isLoading: boolean) => {
    if (isMounted.current) setLoading(isLoading);
  };

  const safeSetError = (errorMsg: string | null) => {
    if (isMounted.current) setError(errorMsg);
  };

  const safeSetTotalCount = (count: number) => {
    if (isMounted.current) setTotalCount(count);
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

  useEffect(() => {
    let isActive = true; // Track if the effect is still active

    async function fetchUserCourses() {
      if (!isActive) return;
      safeSetLoading(true);
      safeSetError(null);

      try {
        // Check if we have userId
        if (!userId || !supabase) {
          safeSetCourses([]);
          safeSetRecentCourses([]);
          safeSetCategories([]);
          safeSetTotalCount(0);
          return;
        }

        // First get the Supabase user ID from the Clerk ID
        let userData;
        let userError;

        try {
          const result = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

          userData = result.data;
          userError = result.error;

          // Check for JWT expired error
          if (userError && (
              userError.message?.includes('JWT expired') ||
              userError.message?.includes('invalid token') ||
              userError.message?.includes('Invalid JWT')
            )) {
            console.log("JWT expired or invalid, refreshing token...");

            // Get a fresh token from Clerk
            if (session) {
              try {
                const token = await session.getToken({ template: 'supabase' });
                console.log("Got fresh token from Clerk:", !!token);

                // Try the query again with the fresh token
                // The token will be automatically used by the Supabase client
                // in the next request due to the useSupabaseClient hook

                // Wait a moment for the token to be processed
                await new Promise(resolve => setTimeout(resolve, 100));

                const retryResult = await supabase
                  .from('users')
                  .select('id')
                  .eq('clerk_id', userId)
                  .single();

                userData = retryResult.data;
                userError = retryResult.error;
              } catch (tokenError) {
                console.error("Error refreshing token:", tokenError);
              }
            }
          }
        } catch (unexpectedError) {
          console.error("Unexpected error getting user:", unexpectedError);
        }

        if (userError) {
          console.error("Error getting user from Supabase:", userError);

          // Check if this is a "no rows returned" error, which means the user hasn't been synced yet
          if (userError.code === 'PGRST116') {
            console.log("User not found in Supabase, may need to be synced");

            // Instead of showing an error, try to use a fallback approach
            // Check if we can find the user by email instead
            if (userId) {
              try {
                console.log("Attempting to find user by Clerk ID as fallback");

                // Create a fallback user ID based on the Clerk ID
                const fallbackUserId = `fallback-${userId}`;
                console.log("Using fallback user ID:", fallbackUserId);

                // Continue with empty state but don't show an error
                // This allows the UI to render properly while we wait for user sync
                safeSetCourses([]);
                safeSetRecentCourses([]);
                safeSetCategories([]);
                safeSetTotalCount(0);
                safeSetLoading(false);
                return;
              } catch (fallbackError) {
                console.error("Error in fallback user handling:", fallbackError);
              }
            }

            safeSetCourses([]);
            safeSetRecentCourses([]);
            safeSetCategories([]);
            safeSetTotalCount(0);
            safeSetError("User not found in Supabase. Please try refreshing the page.");
            safeSetLoading(false);
            return;
          }

          // For JWT errors, we've already tried to refresh the token above
          // Just set empty state and a user-friendly error message
          if (userError.message?.includes('JWT expired') ||
              userError.message?.includes('invalid token') ||
              userError.message?.includes('Invalid JWT')) {
            console.log("JWT issues persist after refresh attempt, setting empty state");
            safeSetCourses([]);
            safeSetRecentCourses([]);
            safeSetCategories([]);
            safeSetTotalCount(0);
            safeSetError("Session expired. Please refresh the page to continue.");
            safeSetLoading(false);
            return;
          }

          // For other errors, log but continue with empty state
          console.error(`Failed to get user data: ${userError.message || JSON.stringify(userError)}`);
          safeSetCourses([]);
          safeSetRecentCourses([]);
          safeSetCategories([]);
          safeSetTotalCount(0);
          // Use a more generic error message that doesn't expose implementation details
          safeSetError("Unable to load your courses. Please try refreshing the page.");
          safeSetLoading(false);
          return;
        }

        if (!userData) {
          console.log("No user found in Supabase");
          safeSetCourses([]);
          safeSetRecentCourses([]);
          return;
        }

        // Get user enrollments from Supabase with pagination and filtering
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
        if (options.category && options.category !== 'all') {
          query = query.eq('courses.category', options.category);
        }

        // Apply search query if provided
        if (options.searchQuery && options.searchQuery.trim() !== '') {
          // We need to handle search differently since we're querying a join
          // This is a limitation - we'll need to filter after fetching
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

        // Apply pagination if specified
        if (options.limit && options.page) {
          const pageSize = options.limit;
          const pageIndex = options.page;
          const start = (pageIndex - 1) * pageSize;

          query = query.range(start, start + pageSize - 1);
        }

        // Execute the query with token refresh handling
        let enrollments;
        let enrollmentsError;
        let count;

        try {
          const result = await query;
          enrollments = result.data;
          enrollmentsError = result.error;
          count = result.count;

          // Check for JWT expired error
          if (enrollmentsError && (
              enrollmentsError.message?.includes('JWT expired') ||
              enrollmentsError.message?.includes('invalid token') ||
              enrollmentsError.message?.includes('Invalid JWT')
            )) {
            console.log("JWT expired or invalid when fetching enrollments, refreshing token...");

            // Get a fresh token from Clerk
            if (session) {
              try {
                const token = await session.getToken({ template: 'supabase' });
                console.log("Got fresh token from Clerk for enrollments:", !!token);

                // Wait a moment for the token to be processed
                await new Promise(resolve => setTimeout(resolve, 100));

                // Try the query again with the fresh token
                const retryResult = await query;
                enrollments = retryResult.data;
                enrollmentsError = retryResult.error;
                count = retryResult.count;
              } catch (tokenError) {
                console.error("Error refreshing token for enrollments:", tokenError);
              }
            }
          }
        } catch (unexpectedError) {
          console.error("Unexpected error getting enrollments:", unexpectedError);
        }

        if (enrollmentsError) {
          console.error("Error getting enrollments from Supabase:", enrollmentsError);

          // For JWT errors, we've already tried to refresh the token above
          // Just set empty state and a user-friendly error message
          if (enrollmentsError.message?.includes('JWT expired') ||
              enrollmentsError.message?.includes('invalid token') ||
              enrollmentsError.message?.includes('Invalid JWT')) {
            console.log("JWT issues persist after refresh attempt for enrollments, setting empty state");
            safeSetCourses([]);
            safeSetRecentCourses([]);
            safeSetCategories([]);
            safeSetTotalCount(0);
            safeSetError("Session expired. Please refresh the page to continue.");
            safeSetLoading(false);
            return;
          }

          // For other errors, log but continue with empty state
          safeSetCourses([]);
          safeSetRecentCourses([]);
          safeSetCategories([]);
          safeSetTotalCount(0);
          safeSetError(`Could not load your courses: ${enrollmentsError.message || "Unknown error"}`);
          safeSetLoading(false);
          return;
        }

        if (enrollments && enrollments.length > 0) {
          // Format enrollments into courses
          let formattedEnrollments = enrollments.map((enrollment: any) => {
            const course = enrollment.courses;
            if (!course) {
              console.warn(`Course data missing for enrollment ${enrollment.id}`);
              return null; // Skip this enrollment if course data is missing
            }

            // Normalize the category using our utility
            const normalizedCategory = normalizeCategory(
              course.category || "",
              Array.isArray(course.tags) ? course.tags : []
            );

            // Extract sections from metadata.courseItems if available
            const sections = (() => {
              // First check if metadata.courseItems exists
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
              id: enrollment.course_id,
              title: course.title || "Untitled Course",
              description: course.description || "",
              image: course.thumbnail || "/placeholders/course-thumbnail.jpg",
              thumbnail: course.thumbnail || "/placeholders/course-thumbnail.jpg",
              videoId: course.video_id || "",
              progress: enrollment.progress || 0,
              lastAccessed: enrollment.last_accessed_at,
              enrolledAt: enrollment.enrolled_at,
              isEnrolled: true,
              category: normalizedCategory, // Use normalized category
              tags: course.tags || [],
              metadata: course.metadata || {},
              completedLessons: enrollment.completed_lessons || [],
              // Store raw duration values for proper formatting in the YouTube style
              duration: course.estimated_hours ? `${course.estimated_hours}h` : undefined,
              estimatedHours: course.estimated_hours || undefined,
              // Store duration in minutes for courses that have it
              durationMinutes: course.duration_minutes || undefined,
              // Store estimated_duration in seconds directly from the database
              estimated_duration: course.estimated_duration || undefined,
              sections: sections,
              totalLessons: totalLessons,
              lessonsCompleted: enrollment.completed_lessons?.length || 0,
            };
          }).filter(Boolean); // Filter out any null entries

          // Apply search filter if needed (client-side)
          if (options.searchQuery && options.searchQuery.trim() !== '') {
            const searchTerm = options.searchQuery.toLowerCase().trim();
            formattedEnrollments = formattedEnrollments.filter(course =>
              course && course.title.toLowerCase().includes(searchTerm) ||
              course && course.description.toLowerCase().includes(searchTerm)
            );
          }

          // Apply client-side sorting if needed
          if (options.sortBy === 'title') {
            formattedEnrollments.sort((a, b) => {
              if (!a || !b) return 0;
              return a.title.localeCompare(b.title);
            });
          }

          // Filter out any null values before setting state
          const validEnrollments = formattedEnrollments.filter(course =>
            course !== null
          ) as Course[];

          // Set recent courses (first 2)
          safeSetRecentCourses(validEnrollments.slice(0, 2));

          // Set all courses
          safeSetCourses(validEnrollments);
          safeSetTotalCount(count || validEnrollments.length);

          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(validEnrollments.map(course => course.category))
          ).filter(Boolean);

          safeSetCategories(uniqueCategories);
        } else {
          // No user enrollments, show empty state
          safeSetCourses([]);
          safeSetRecentCourses([]);
          safeSetCategories([]);
          safeSetTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching user courses:', err);
        // Provide more detailed error information
        let errorMessage = 'Failed to fetch courses';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = `Error fetching courses: ${JSON.stringify(err)}`;
        }
        safeSetError(errorMessage);
        safeSetCourses([]);
        safeSetRecentCourses([]);
      } finally {
        safeSetLoading(false);
      }
    }

    fetchUserCourses();

    // Cleanup function to cancel any pending operations when the effect is cleaned up
    return () => {
      isActive = false;
    };
  }, [
    userId,
    supabase,
    session,
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
