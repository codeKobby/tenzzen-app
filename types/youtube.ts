/**
 * Types for YouTube API responses and data structures
 */

// YouTube channel information
export interface ChannelInfo {
  id: string;
  name: string;
  thumbnail: string;
  url?: string;
  subscriberCount?: string;
}

// Base content details shared by videos and playlists
export interface ContentDetails {
  id: string;
  type: 'video' | 'playlist';
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  channel?: ChannelInfo;
  videos?: VideoDetails[];
  viewCount?: string;
  likeCount?: string;
  publishedAt?: string;
}

// Specific video details
export interface VideoDetails extends ContentDetails {
  type: 'video';
  tags?: string[];
  isLiveContent?: boolean;
}

// Specific playlist details
export interface PlaylistDetails extends ContentDetails {
  type: 'playlist';
  itemCount?: number;
  videos: VideoDetails[];
}

// YouTube transcript segment
export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// YouTube search result
export interface SearchResult {
  id: string;
  type: 'video' | 'playlist' | 'channel';
  title: string;
  thumbnail: string;
  description?: string;
  channel?: ChannelInfo;
  publishedAt?: string;
  viewCount?: string;
}

// YouTube API error
export interface YouTubeApiError {
  message: string;
  code: string;
  errors?: {
    message: string;
    domain: string;
    reason: string;
  }[];
}
