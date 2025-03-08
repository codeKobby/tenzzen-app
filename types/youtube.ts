// Base types for cached data
export interface CachedVideo {
  youtubeId: string
  title: string
  description?: string
  thumbnail?: string
  duration?: string
  channelId?: string
  channelName?: string
  channelAvatar?: string
  views?: string
  likes?: string
  publishDate?: string
  cachedAt: string
}

export interface CachedPlaylist {
  youtubeId: string
  title: string
  thumbnail?: string
  channelId?: string
  channelName?: string
  videoCount?: number
  cachedAt: string
}

export interface PlaylistVideoRelation {
  playlistId: string
  videoId: string
  position: number
  cachedAt: string
}

// Frontend types for displaying content

// Single video details
export interface VideoDetails {
  id: string
  type: "video"  // Literal type to help with type narrowing
  title: string
  description: string
  thumbnail: string
  duration: string
  channelId: string
  channelName: string
  channelAvatar?: string
  views: string
  likes: string
  publishDate: string
}

// Video item in a playlist - make the type definition more explicit
export interface VideoItem {
  id: string
  videoId: string
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelName: string
  duration: string
  views?: string
  likes?: string
  publishDate?: string
  position: number
}

// Playlist details with videos
export interface PlaylistDetails {
  id: string
  type: "playlist"  // Literal type to help with type narrowing
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelName: string
  channelAvatar?: string
  videoCount: string  // Changed to string to match our getPlaylistDetails implementation
  publishDate?: string
  videos: VideoItem[]  // Array of VideoItems
}

// Union type for content
export type ContentDetails = VideoDetails | PlaylistDetails
