'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { useAuth } from '@clerk/nextjs';

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
  const [course, setCourse] = useState<NormalizedCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId || !supabase) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch the course details
        const { data: courseData, error: courseError } = await supabase
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

        if (courseError) {
          throw new Error(`Error fetching course: ${courseError.message}`);
        }

        if (!courseData) {
          throw new Error('Course not found');
        }

        // Fetch course sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('course_sections')
          .select('id, title, description, order_index')
          .eq('course_id', courseId)
          .order('order_index');

        if (sectionsError) {
          throw new Error(`Error fetching course sections: ${sectionsError.message}`);
        }

        // Fetch lessons for each section
        const sections: NormalizedSection[] = [];
        for (const section of sectionsData) {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('course_lessons')
            .select('id, title, content, video_timestamp, duration, order_index')
            .eq('section_id', section.id)
            .order('order_index');

          if (lessonsError) {
            throw new Error(`Error fetching lessons for section ${section.id}: ${lessonsError.message}`);
          }

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
  }, [courseId, supabase, userId, options.includeProgress]);

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
