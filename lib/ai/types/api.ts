import { z } from 'zod';

// Video Content
export interface VideoContent {
  title: string;
  duration?: string;
  description: string;
}

// Playlist Video
export interface PlaylistVideo {
  title: string;
  duration: string;
  description: string;
}

// Video Section
export interface VideoSection {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  transcript: string;
}

// Input Schemas
export const videoSchema = z.object({
  type: z.literal('video'),
  data: z.object({
    title: z.string(),
    duration: z.string().optional(),
    description: z.string()
  })
});

export const playlistSchema = z.object({
  type: z.literal('playlist'),
  data: z.object({
    title: z.string(),
    description: z.string(),
    videos: z.array(z.object({
      title: z.string(),
      duration: z.string(),
      description: z.string()
    }))
  })
});

export const segmentSchema = z.object({
  type: z.literal('segment'),
  data: z.object({
    videoId: z.string(),
    section: z.object({
      title: z.string(),
      description: z.string(),
      startTime: z.number(),
      endTime: z.number(),
      transcript: z.string()
    })
  })
});

export const inputSchema = z.discriminatedUnion('type', [
  videoSchema,
  playlistSchema,
  segmentSchema
]);

// Types from schemas
export type VideoInput = z.infer<typeof videoSchema>;
export type PlaylistInput = z.infer<typeof playlistSchema>;
export type SegmentInput = z.infer<typeof segmentSchema>;
export type AIInput = z.infer<typeof inputSchema>;

// API Response Types
export interface APIErrorResponse {
  error: string;
  details?: unknown;
}

export interface APISuccessResponse<T> {
  data: T;
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

export function isAPIError(response: unknown): response is APIErrorResponse {
  return typeof response === 'object' && response !== null && 'error' in response;
}

export function createErrorResponse(error: unknown): APIErrorResponse {
  if (error instanceof z.ZodError) {
    return {
      error: 'Invalid request format',
      details: error.issues
    };
  }

  return {
    error: error instanceof Error ? error.message : 'An unexpected error occurred'
  };
}

export function createSuccessResponse<T>(data: T): APISuccessResponse<T> {
  return { data };
}