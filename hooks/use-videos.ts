import { useState, useCallback, useEffect } from "react"
import { useSupabase } from "@/contexts/supabase-context"
import { Id } from "@/types/convex-types"

/**
 * Input type for adding a new video
 */
export interface VideoInput {
  id: string
  title: string
  description?: string
  thumbnail?: string
  duration?: string
  channel_id?: string
  channel_name?: string
  channel_avatar?: string
  views?: string
  likes?: string
  publish_date?: string
}

/**
 * Options for configuring the useVideos hook
 */
interface UseVideosOptions {
  /** Maximum number of videos to fetch */
  limit?: number
  /** Cursor for pagination */
  cursor?: string
}

/**
 * Hook for managing videos in the application
 *
 * Provides functionality for:
 * - Listing videos with pagination
 * - Adding new videos
 * - Removing videos
 * - Error handling
 * - Loading states
 *
 * @param options - Configuration options for the hook
 * @returns Object containing video data and management functions
 */
export function useVideos({ limit = 10, cursor }: UseVideosOptions = {}) {
  const supabase = useSupabase()
  const [videos, setVideos] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

  // Fetch videos from Supabase
  const fetchVideos = useCallback(async () => {
    setIsLoadingVideos(true)
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Add cursor pagination if provided
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setVideos(data || []);
      setHasNextPage(data && data.length === limit);
      setNextCursor(data && data.length === limit ? data[data.length - 1].created_at : undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch videos";
      setError(message);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [supabase, limit, cursor]);

  // Load videos on mount and when dependencies change
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const addNewVideo = useCallback(async (videoData: VideoInput) => {
    try {
      setError(null)
      setIsLoading(true)
      const { data, error } = await supabase
        .from('videos')
        .insert([{
          ...videoData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh videos
      fetchVideos();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add video";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchVideos]);

  const removeVideo = useCallback(async (id: string) => {
    try {
      setError(null)
      setIsLoading(true)
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Refresh videos
      fetchVideos();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete video";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchVideos]);

  return {
    /** List of videos */
    videos: videos || [],
    /** Current error message, if any */
    error,
    /** Whether a mutation is in progress */
    isLoading,
    /** Function to add a new video */
    addNewVideo,
    /** Function to remove a video */
    removeVideo,
    /** Whether videos are being loaded */
    isLoadingVideos,
    /** Whether there are more videos to load */
    hasNextPage,
    /** Cursor for loading the next page */
    nextCursor
  }
}
