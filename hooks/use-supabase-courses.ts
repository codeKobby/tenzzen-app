'use client';

import { useSupabase } from '@/contexts/supabase-context';
import { useCallback, useState } from 'react';

/**
 * Hook to query a video from Supabase by its YouTube ID
 * Replacement for useVideoQuery from Convex
 */
export function useSupabaseVideoQuery(youtubeId: string) {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any | null>(null);

  const fetchVideo = useCallback(async () => {
    if (!youtubeId) {
      setData(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Query the videos table for the video with the given YouTube ID
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('video_id', youtubeId)
        .single();

      if (videoError) {
        throw videoError;
      }

      // Check if the cache is expired (older than 1 hour)
      if (videoData) {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        const cachedAt = new Date(videoData.cached_at);

        if (cachedAt < oneHourAgo) {
          setData({ id: videoData.id, expired: true });
          setLoading(false);
          return { id: videoData.id, expired: true };
        }

        setData(videoData);
        setLoading(false);
        return videoData;
      }

      setData(null);
      setLoading(false);
      return null;
    } catch (err) {
      console.error('Error fetching video from Supabase:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      return null;
    }
  }, [supabase, youtubeId]);

  // Execute the query immediately
  useCallback(() => {
    fetchVideo();
  }, [fetchVideo]);

  return { data, loading, error, refetch: fetchVideo };
}

/**
 * Hook to update video course data in Supabase
 * Replacement for useUpdateVideoCourseData from Convex
 */
export function useUpdateSupabaseVideoCourseData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateVideoCourseData = useCallback(async ({ youtubeId, courseData }: { youtubeId: string, courseData: any }) => {
    if (!youtubeId || !courseData) {
      return { success: false, error: 'Missing required data' };
    }

    setLoading(true);
    setError(null);

    try {
      // Use the server API route to update the video
      // This uses the service role key which bypasses RLS policies
      const response = await fetch('/api/supabase/videos/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeId,
          courseData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update video');
      }

      const result = await response.json();
      setLoading(false);
      return { success: true, data: result.data };
    } catch (err) {
      console.error('Error updating video course data in Supabase:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  return { updateVideoCourseData, loading, error };
}

/**
 * Hook to save a course to the public database in Supabase
 * Replacement for useSaveGeneratedCourseToPublic from Convex
 */
export function useSaveSupabaseCourseToPublic() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveGeneratedCourseToPublic = useCallback(async ({ courseData, userId }: { courseData: any, userId?: string }) => {
    if (!courseData || !courseData.title || !courseData.videoId) {
      return { success: false, error: 'Missing required course data' };
    }

    setLoading(true);
    setError(null);

    try {
      // Call the API route to save the course
      const response = await fetch('/api/supabase/courses/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData: {
            title: courseData.title,
            description: courseData.description || '',
            videoId: courseData.videoId,
            thumbnail: courseData.thumbnail || courseData.image || null,
            metadata: courseData.metadata || {},
            courseItems: courseData.courseItems || [],
            transcript: courseData.transcript || null
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save course');
      }

      const result = await response.json();
      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      console.error('Error saving course to Supabase:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  return { saveGeneratedCourseToPublic, loading, error };
}
