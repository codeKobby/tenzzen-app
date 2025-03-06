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

export interface PlaylistDetails {
  id: string
  type: "playlist"
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelName: string
  channelAvatar?: string
  videoCount: string
  videos: VideoItem[]
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

export interface DatabaseVideo {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  duration: string | null
  channel_id: string | null
  channel_name: string | null
  channel_avatar: string | null
  views: string | null
  likes: string | null
  publish_date: string | null
  created_at: string
  updated_at: string
}

export type ContentDetails = VideoDetails | PlaylistDetails;
