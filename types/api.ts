/**
 * API Types definitions
 */

// Options for course generation
export interface CourseGenerationOptions {
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  includeProject?: boolean;
  includeAssessments?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

// API Response types for course generation
export interface CourseGenerationResponse {
  success: boolean;
  data: any;
  message?: string;
}

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

// API verification response
export interface APIVerificationResponse {
  valid: boolean;
  message?: string;
}