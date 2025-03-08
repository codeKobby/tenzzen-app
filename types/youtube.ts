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
export interface VideoDetails extends Omit<CachedVideo, 'youtubeId' | 'cachedAt'> {
  id: string
  type: "video"
}

// Video item in a playlist
export interface VideoItem {
  id: string
  videoId: string
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelName: string
  publishDate: string
  position: number
  duration: string
}

export interface PlaylistDetails extends Omit<CachedPlaylist, 'youtubeId' | 'cachedAt'> {
  id: string
  type: "playlist"
  videos: VideoItem[]
}

export type ContentDetails = VideoDetails | PlaylistDetails
