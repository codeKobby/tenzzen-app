import { ConvexError } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"

// Video document from our schema
export type Video = Doc<"videos"> & {
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

// Input type for creating/updating videos
export type VideoInput = Omit<Video, "userId" | "created_at" | "updated_at" | "_id" | "_creationTime">

// API Error types
export type ApiError = {
  code: string
  message: string
  details?: unknown
}

// Helper to create consistent API errors
export function createApiError(
  code: string,
  message: string,
  details?: unknown
): ConvexError {
  return new ConvexError({
    code,
    message,
    details
  })
}

// Common API error codes
export const ApiErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const

export type ApiErrorCode = typeof ApiErrorCodes[keyof typeof ApiErrorCodes]

// Type for API success responses
export type ApiSuccess<T> = {
  data: T
  status: "success"
}

// Type for pagination parameters
export type PaginationParams = {
  limit?: number
  cursor?: string
}

// Type for paginated responses
export type PaginatedResponse<T> = {
  items: T[]
  nextCursor?: string
  total?: number
}

// YouTube Data Types
export type YouTubeData = {
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
}
