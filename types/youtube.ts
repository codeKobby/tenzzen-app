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
  channelId?: string; // Added channelId at the base level for consistency
  channelName?: string; // Added channelName at the base level for consistency
  channelAvatar?: string; // Added channelAvatar for consistency
  duration?: string;
  videos?: VideoItem[] | VideoDetails[]; // Made this more flexible to accept either type
  viewCount?: string;
  likeCount?: string;
  publishedAt?: string;
  publishDate?: string; // Add publishDate here as an alternative to publishedAt for consistency
}

/**
 * Video details from YouTube API
 */
export interface VideoDetails {
  id: string;
  type: 'video';
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  channelAvatar?: string;
  duration: string;
  views: string;
  likes?: string;
  publishDate?: string; // Keep consistent with implementation
}

/**
 * Video item in a playlist
 */
export interface VideoItem {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  duration: string;
  position: number;
  publishDate?: string; // Keep consistent with implementation
}

// Specific playlist details
export interface PlaylistDetails extends ContentDetails {
  type: 'playlist';
  itemCount?: number;
  channelId: string; // Added channelId explicitly here to match the usage
  channelName: string; // Added channelName explicitly here to match the usage
  channelAvatar?: string; // Added channelAvatar for consistency
  videos: VideoItem[]; // Changed to VideoItem[] since that's what's used in getPlaylistDetails
  publishDate?: string; // Add publishDate to match implementation
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
