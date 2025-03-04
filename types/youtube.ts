export interface VideoDetails {
  id: string
  type: "video"
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

export interface VideoItem {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  channelId: string
  channelName: string
  views: string
  publishDate: string
}

export interface PlaylistDetails {
  id: string
  type: "playlist"
  title: string
  description?: string
  thumbnail: string
  channelId: string
  channelName: string
  channelAvatar?: string
  videoCount: string
  views?: string
  likes?: string
  publishDate?: string
  videos: VideoItem[]
}

export type ContentDetails = VideoDetails | PlaylistDetails