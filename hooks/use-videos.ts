import { useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { useState, useCallback } from "react"
import { Id } from "../convex/_generated/dataModel"

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
  const videos = useQuery(api.videos.listVideos, { cursor, limit })
  const addVideo = useMutation(api.videos.addVideo)
  const deleteVideo = useMutation(api.videos.deleteVideo)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const addNewVideo = useCallback(async (videoData: VideoInput) => {
    try {
      setError(null)
      setIsLoading(true)
      const result = await addVideo(videoData)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add video"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [addVideo])

  const removeVideo = useCallback(async (id: string) => {
    try {
      setError(null)
      setIsLoading(true)
      const result = await deleteVideo({ id })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete video"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [deleteVideo])

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
    isLoadingVideos: videos === undefined,
    /** Whether there are more videos to load */
    hasNextPage: videos !== undefined && videos.length === limit,
    /** Cursor for loading the next page */
    nextCursor: videos?.length === limit ? videos[videos.length - 1]._id : undefined
  }
}
