/**
 * API Types definitions
 */


// Error response types
export interface APIErrorResponse {
  message: string;
  details?: any;
}

// YouTube data fetch response
export interface YouTubeDataResponse {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelTitle?: string;
  publishedAt?: string;
  duration?: string;
  type?: 'video' | 'playlist';
}

// YouTube transcript response segment
export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}
