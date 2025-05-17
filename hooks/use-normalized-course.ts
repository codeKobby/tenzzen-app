'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { useAuth, useSession } from '@clerk/nextjs';
import { isValidUUID, validateCourseId } from '@/lib/utils';

export interface NormalizedLesson {
  id: string;
  title: string;
  content?: string;
  videoTimestamp?: number;
  duration?: number;
  orderIndex: number;
  completed?: boolean;
}

export interface NormalizedSection {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: NormalizedLesson[];
}

export interface NormalizedCourse {
  id: string;
  title: string;
  description?: string;
  videoId: string;
  youtubeUrl?: string;
  thumbnail?: string;
  isPublic: boolean;
  createdBy?: string;
  creatorId?: string;
  avgRating?: number;
  enrollmentCount?: number;
  status?: string;
  difficultyLevel?: string;
  estimatedDuration?: string;
  estimatedHours?: number;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  category?: string;
  featured?: boolean;
  popularity?: number;
  metadata?: any;
  generatedSummary?: string;
  transcript?: string;
  sections: NormalizedSection[];
  progress?: number;
  completedLessons?: string[];
  isEnrolled?: boolean;
  enrollmentId?: string;
}

interface UseNormalizedCourseOptions {
  includeProgress?: boolean;
}

export function useNormalizedCourse(courseId: string, options: UseNormalizedCourseOptions = {}) {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const { session } = useSession();
  const [course, setCourse] = useState<NormalizedCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCourse() {
      // Validate courseId before doing anything else
      if (!courseId || !supabase) return;

      // Pre-validate the courseId format before setting loading state or making any queries
      const validation = validateCourseId(courseId);
      if (!validation.isValid) {
        console.error(`Invalid course ID: ${validation.error}`);
        setError(validation.error || 'Invalid course ID');

        // Redirect to courses page if in browser
        if (typeof window !== 'undefined') {
          console.log('Redirecting to courses page due to invalid course ID');
          window.location.href = '/courses';
        }
        return; // Exit immediately, don't proceed with any database queries
      }

      // Only set loading state after validation passes
      setLoading(true);
      setError(null);

      try {
        // Fetch the course details with token refresh handling
        let courseData;
        let courseError;

        try {
          const result = await supabase
            .from('courses')
            .select(`
              id, title, description, video_id, youtube_url, thumbnail,
              is_public, created_by, creator_id, avg_rating, enrollment_count,
              status, difficulty_level, estimated_duration, estimated_hours,
              created_at, updated_at, tags, category, featured, popularity,
              metadata, generated_summary, transcript
            `)
            .eq('id', courseId)
            .single();

          courseData = result.data;
          courseError = result.error;

          // Check for JWT expired error
          if (courseError && (
            courseError.message?.includes('JWT expired') ||
            courseError.message?.includes('invalid token') ||
            courseError.message?.includes('Invalid JWT')
          )) {
            console.log("JWT expired or invalid, refreshing token...");

            // Get a fresh token from Clerk
            if (session) {
              try {
                const token = await session.getToken({ template: 'supabase' });
                console.log("Got fresh token from Clerk:", !!token);

                // Wait a moment for the token to be processed
                await new Promise(resolve => setTimeout(resolve, 100));

                // Try the query again with the fresh token
                const retryResult = await supabase
                  .from('courses')
                  .select(`
                    id, title, description, video_id, youtube_url, thumbnail,
                    is_public, created_by, creator_id, avg_rating, enrollment_count,
                    status, difficulty_level, estimated_duration, estimated_hours,
                    created_at, updated_at, tags, category, featured, popularity,
                    metadata, generated_summary, transcript
                  `)
                  .eq('id', courseId)
                  .single();

                courseData = retryResult.data;
                courseError = retryResult.error;
              } catch (tokenError) {
                console.error("Error refreshing token:", tokenError);
              }
            }
          }
        } catch (unexpectedError) {
          console.error("Unexpected error getting course:", unexpectedError);
          throw unexpectedError;
        }

        if (courseError) {
          // For JWT errors, we've already tried to refresh the token above
          if (courseError.message?.includes('JWT expired') ||
              courseError.message?.includes('invalid token') ||
              courseError.message?.includes('Invalid JWT')) {
            throw new Error("Session expired. Please refresh the page to continue.");
          }
          throw new Error(`Error fetching course: ${courseError.message}`);
        }

        if (!courseData) {
          throw new Error('Course not found');
        }

        // Fetch course sections
        let sections: NormalizedSection[] = [];

        try {
          const { data: sectionsData, error: sectionsError } = await supabase
            .from('course_sections')
            .select('id, title, description, order_index')
            .eq('course_id', courseId)
            .order('order_index');

          if (sectionsError) {
            console.error(`Error fetching course sections: ${sectionsError.message}`);
            // Continue with empty sections instead of throwing
          } else if (sectionsData && sectionsData.length > 0) {
            // Fetch lessons for each section
            for (const section of sectionsData) {
              try {
                const { data: lessonsData, error: lessonsError } = await supabase
                  .from('course_lessons')
                  .select('id, title, content, video_timestamp, duration, order_index')
                  .eq('section_id', section.id)
                  .order('order_index');

                if (lessonsError) {
                  console.error(`Error fetching lessons for section ${section.id}: ${lessonsError.message}`);
                  // Add section with empty lessons
                  sections.push({
                    id: section.id,
                    title: section.title,
                    description: section.description,
                    orderIndex: section.order_index,
                    lessons: []
                  });
                } else {
                  sections.push({
                    id: section.id,
                    title: section.title,
                    description: section.description,
                    orderIndex: section.order_index,
                    lessons: lessonsData.map(lesson => ({
                      id: lesson.id,
                      title: lesson.title,
                      content: lesson.content,
                      videoTimestamp: lesson.video_timestamp,
                      duration: lesson.duration,
                      orderIndex: lesson.order_index,
                      completed: false // Will be updated if user is enrolled
                    }))
                  });
                }
              } catch (lessonError) {
                console.error(`Unexpected error fetching lessons: ${lessonError}`);
                // Add section with empty lessons
                sections.push({
                  id: section.id,
                  title: section.title,
                  description: section.description,
                  orderIndex: section.order_index,
                  lessons: []
                });
              }
            }
          } else {
            // No sections found, check if course has course_items in JSONB
            if (courseData.course_items) {
              try {
                // Try to parse course_items if it exists
                const courseItems = typeof courseData.course_items === 'string'
                  ? JSON.parse(courseData.course_items)
                  : courseData.course_items;

                if (Array.isArray(courseItems)) {
                  // Convert course_items to sections format
                  sections = courseItems.map((section, index) => ({
                    id: `section-${index}`,
                    title: section.title || `Section ${index + 1}`,
                    description: section.description || '',
                    orderIndex: index,
                    lessons: (section.lessons || []).map((lesson, lessonIndex) => ({
                      id: `lesson-${index}-${lessonIndex}`,
                      title: lesson.title || `Lesson ${lessonIndex + 1}`,
                      content: lesson.content || '',
                      videoTimestamp: lesson.videoTimestamp || lesson.video_timestamp || 0,
                      duration: lesson.duration || 0,
                      orderIndex: lessonIndex,
                      completed: false
                    }))
                  }));
                }
              } catch (parseError) {
                console.error('Error parsing course_items:', parseError);
              }
            }

            // If still no sections, create a default section with one lesson
            if (sections.length === 0) {
              sections = [{
                id: 'default-section',
                title: 'Course Content',
                description: 'This course has no sections yet.',
                orderIndex: 0,
                lessons: [{
                  id: 'default-lesson',
                  title: 'Introduction',
                  content: 'This course has no lessons yet.',
                  videoTimestamp: 0,
                  duration: 0,
                  orderIndex: 0,
                  completed: false
                }]
              }];
            }
          }
        } catch (sectionError) {
          console.error(`Unexpected error in section handling: ${sectionError}`);
          // Create a default section with one lesson
          sections = [{
            id: 'default-section',
            title: 'Course Content',
            description: 'This course has no sections yet.',
            orderIndex: 0,
            lessons: [{
              id: 'default-lesson',
              title: 'Introduction',
              content: 'This course has no lessons yet.',
              videoTimestamp: 0,
              duration: 0,
              orderIndex: 0,
              completed: false
            }]
          }];
        }

        // Check if user is enrolled and fetch progress if needed
        let userEnrollment = null;
        let userProgress = 0;
        let userCompletedLessons: string[] = [];

        if (userId && options.includeProgress) {
          // Get the Supabase user ID from the Clerk ID
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

          if (!userError && userData) {
            // Check if user is enrolled
            const { data: enrollmentData, error: enrollmentError } = await supabase
              .from('enrollments')
              .select('id, progress, completed_lessons')
              .eq('user_id', userData.id)
              .eq('course_id', courseId)
              .single();

            if (!enrollmentError && enrollmentData) {
              userEnrollment = enrollmentData;
              userProgress = enrollmentData.progress || 0;
              userCompletedLessons = enrollmentData.completed_lessons || [];

              // Mark completed lessons
              for (const section of sections) {
                for (const lesson of section.lessons) {
                  const lessonIdentifier = `${section.orderIndex}-${lesson.orderIndex}`;
                  lesson.completed = userCompletedLessons.includes(lessonIdentifier);
                }
              }
            }
          }
        }

        // Construct the normalized course object
        const normalizedCourse: NormalizedCourse = {
          id: courseData.id,
          title: courseData.title,
          description: courseData.description,
          videoId: courseData.video_id,
          youtubeUrl: courseData.youtube_url,
          thumbnail: courseData.thumbnail,
          isPublic: courseData.is_public,
          createdBy: courseData.created_by,
          creatorId: courseData.creator_id,
          avgRating: courseData.avg_rating,
          enrollmentCount: courseData.enrollment_count,
          status: courseData.status,
          difficultyLevel: courseData.difficulty_level,
          estimatedDuration: courseData.estimated_duration,
          estimatedHours: courseData.estimated_hours,
          createdAt: courseData.created_at,
          updatedAt: courseData.updated_at,
          tags: courseData.tags,
          category: courseData.category,
          featured: courseData.featured,
          popularity: courseData.popularity,
          metadata: courseData.metadata,
          generatedSummary: courseData.generated_summary,
          transcript: courseData.transcript,
          sections: sections,
          progress: userProgress,
          completedLessons: userCompletedLessons,
          isEnrolled: !!userEnrollment,
          enrollmentId: userEnrollment?.id
        };

        setCourse(normalizedCourse);
        setIsEnrolled(!!userEnrollment);
        setEnrollmentId(userEnrollment?.id || null);
        setProgress(userProgress);
        setCompletedLessons(userCompletedLessons);
      } catch (err) {
        console.error('Error in useNormalizedCourse:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId, supabase, userId, session, options.includeProgress]);

  return {
    course,
    loading,
    error,
    isEnrolled,
    enrollmentId,
    progress,
    completedLessons
  };
}
