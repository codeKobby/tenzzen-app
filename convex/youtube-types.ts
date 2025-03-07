export interface CaptionSegment {
  text: string
  start: number
  duration: number
}

export interface TranscriptSegment {
  text: string
  startTime: string
  duration: string
}

export interface VideoMetadata {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  channelId: string
  channelName: string
  views: string
  likes: string
  publishDate: string
}

export interface ChannelMetadata {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  joinDate: string
}

export interface APIResponse<T> {
  data: T
  error: string | null
}
