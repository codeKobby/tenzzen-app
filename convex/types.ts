// API Error types
export type ApiErrorType = 
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"

export interface ApiError extends Error {
  type: ApiErrorType
  details?: Record<string, any>
}

export function createApiError(
  type: ApiErrorType,
  message: string,
  details?: Record<string, any>
): ApiError {
  const error = new Error(message) as ApiError
  error.type = type
  error.details = details
  return error
}

// Video types
export interface VideoData {
  id: string
  title: string
  description?: string
  thumbnail?: string
  duration?: string
  channel_id?: string
  channel_name?: string
  channel_avatar?: string
  views?: string
  likes?: string
  publish_date?: string
  userId: string
  created_at: string
  updated_at: string
}

// Transcript types
export interface TranscriptSegment {
  text: string
  duration: number
  offset: number
}

// Search types
export interface SearchOptions {
  fuzzy?: boolean
  language?: string
  timeRange?: {
    start: number
    end: number
  }
}
