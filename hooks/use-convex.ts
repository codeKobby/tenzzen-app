"use client"

import { ConvexReactClient, useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

// Create a client for client-side hooks
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!
export const convex = new ConvexReactClient(convexUrl)

/**
 * Type-safe hook wrappers for Convex
 */
export function useVideoQuery(videoId: string) {
  return useQuery(api.videos.getCachedVideo, { youtubeId: videoId })
}

export function usePlaylistQuery(playlistId: string) {
  return useQuery(api.videos.getCachedPlaylist, { youtubeId: playlistId })
}

export function useCacheVideo() {
  return useMutation(api.videos.cacheVideo)
}

export function useCachePlaylist() {
  return useMutation(api.videos.cachePlaylist)
}

// Re-export useful types and functions
export { api }
export type { VideoDetails, PlaylistDetails } from "@/types/youtube"
