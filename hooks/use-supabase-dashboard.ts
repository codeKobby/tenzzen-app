'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { useUser } from '@clerk/clerk-react';

// Define interfaces for type safety
export interface Course {
  id: string;
  title: string;
  thumbnail?: string;
  progress: number;
  last_accessed_at: string;
  completed_lessons?: string[];
  sections?: {
    title: string;
    lessons?: {
      id: string;
      title: string;
      type: string;
    }[];
  }[];
  overview?: {
    skills?: string[];
    difficulty_level?: string;
    total_duration?: string;
  };
}

export interface LearningActivity {
  id: string;
  type: string;
  timestamp: string;
  course_id?: string;
  metadata?: any;
  course_name?: string;
  assessment_title?: string;
}

export interface UserStats {
  total_learning_hours?: number;
  courses_in_progress?: number;
  courses_completed?: number;
  projects_submitted?: number;
  streak_days?: number;
  longest_streak?: number;
  weekly_activity?: number[];
}

/**
 * Hook to fetch user stats from Supabase
 */
export function useUserStats() {
  const supabase = useSupabase();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user) {
      setLoading(false);
      return;
    }

    const fetchUserStats = async () => {
      try {
        setLoading(true);

        // Verify user is properly authenticated
        if (!user || !user.id) {
          console.error('User not properly authenticated for fetching stats');
          setError(new Error('User not authenticated'));
          setLoading(false);
          return;
        }

        console.log('Fetching user stats for user ID:', user.id);

        // First check if the user exists in the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (userError) {
          console.error('Error finding user in Supabase:', userError);

          // If the user doesn't exist, we should create a default entry
          if (userError.code === 'PGRST116') { // Not found error
            console.log('User not found in Supabase, creating default stats');

            // Create a default user stats entry
            setUserStats({
              total_learning_hours: 0,
              courses_in_progress: 0,
              courses_completed: 0,
              projects_submitted: 0,
              streak_days: 0,
              longest_streak: 0,
              weekly_activity: [0, 0, 0, 0, 0, 0, 0]
            });

            setLoading(false);
            return;
          }

          throw userError;
        }

        // Now fetch the user stats with the Supabase user ID
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (error) {
          console.error('Error fetching user stats:', error);

          // If stats don't exist, return default values
          if (error.code === 'PGRST116') { // Not found error
            console.log('User stats not found, using defaults');
            setUserStats({
              total_learning_hours: 0,
              courses_in_progress: 0,
              courses_completed: 0,
              projects_submitted: 0,
              streak_days: 0,
              longest_streak: 0,
              weekly_activity: [0, 0, 0, 0, 0, 0, 0]
            });
          } else {
            throw error;
          }
        } else {
          console.log('Successfully fetched user stats:', data);
          setUserStats(data);
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [supabase, user, isUserLoaded, isSignedIn]);

  return { userStats, loading, error };
}

/**
 * Hook to fetch recent courses from Supabase
 */
export function useRecentCourses(limit: number = 4) {
  const supabase = useSupabase();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [recentCourses, setRecentCourses] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user) {
      setLoading(false);
      return;
    }

    const fetchRecentCourses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_courses')
          .select(`
            course_id,
            progress,
            last_accessed_at,
            completed_lessons,
            courses (
              id,
              title,
              thumbnail,
              metadata,
              course_items
            )
          `)
          .eq('user_id', user.id)
          .order('last_accessed_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Transform the data to match the expected format
        const transformedCourses = data.map(item => ({
          id: item.course_id,
          title: item.courses.title,
          thumbnail: item.courses.thumbnail,
          progress: item.progress || 0,
          last_accessed_at: item.last_accessed_at,
          completed_lessons: item.completed_lessons || [],
          // Transform course_items to sections if needed
          sections: item.courses.course_items?.map((section: any) => ({
            title: section.title,
            lessons: section.lessons?.map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title,
              type: lesson.type
            }))
          })) || [],
          // Extract overview from metadata
          overview: {
            skills: item.courses.metadata?.skills || [],
            difficulty_level: item.courses.metadata?.difficulty_level || 'Beginner',
            total_duration: item.courses.metadata?.total_duration || 'Unknown'
          }
        }));

        setRecentCourses(transformedCourses);
      } catch (err) {
        console.error('Error fetching recent courses:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchRecentCourses();
  }, [supabase, user, isUserLoaded, isSignedIn, limit]);

  return { recentCourses, loading, error };
}

/**
 * Hook to fetch recent learning activities from Supabase
 */
export function useRecentActivities(limit: number = 10) {
  const supabase = useSupabase();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [activities, setActivities] = useState<LearningActivity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user) {
      setLoading(false);
      return;
    }

    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('learning_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setActivities(data);
      } catch (err) {
        console.error('Error fetching recent activities:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, [supabase, user, isUserLoaded, isSignedIn, limit]);

  return { activities, loading, error };
}

/**
 * Hook to fetch learning trends from Supabase
 */
export function useLearningTrends(timeframe: 'day' | 'week' | 'month' = 'week') {
  const supabase = useSupabase();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [trends, setTrends] = useState<{ weeklyActivity?: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user) {
      setLoading(false);
      return;
    }

    const fetchLearningTrends = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_stats')
          .select('weekly_activity')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setTrends({ weeklyActivity: data?.weekly_activity || [0, 0, 0, 0, 0, 0, 0] });
      } catch (err) {
        console.error('Error fetching learning trends:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchLearningTrends();
  }, [supabase, user, isUserLoaded, isSignedIn, timeframe]);

  return { trends, loading, error };
}
