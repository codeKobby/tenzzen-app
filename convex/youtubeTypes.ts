import { Id } from "./_generated/dataModel"

// Internal types for Convex database schema
export interface DbVideo {
  _id: Id<"videos">
  _creationTime: number
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

export interface DbPlaylist {
  _id: Id<"playlists">
  _creationTime: number
  youtubeId: string
  title: string
  thumbnail?: string
  channelId?: string
  channelName?: string
  videoCount?: number
  cachedAt: string
}

export interface DbPlaylistVideo {
  _id: Id<"playlist_videos">
  _creationTime: number
  playlistId: string
  videoId: string
  position: number
  cachedAt: string
}

// Type guard for video documents
export function isDbVideo(doc: any): doc is DbVideo {
  return doc !== null && 
         typeof doc._id === 'object' && 
         doc._id.__tableName === 'videos' &&
         typeof doc.youtubeId === 'string' &&
         typeof doc.title === 'string'
}
