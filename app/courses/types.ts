export interface Course {
  id: string
  title: string
  description: string
  duration?: string
  progress: number
  category: string
  thumbnail?: string
  image?: string // Add image property
  lastAccessed?: string | number | Date
  videoSource?: string
  instructor?: string
  isPublic?: boolean
  isEnrolled?: boolean // Add isEnrolled property
  sources?: Array<{
    name: string
    avatar: string
  }>
  metadata?: {
    duration?: string | number
    category?: string
    prerequisites?: string[]
    objectives?: string[]
    targetAudience?: string[]
    sources?: any[]
    difficulty?: string
  }
  topics?: {
    current: number
    total: number
    currentTitle: string
  }
  totalLessons?: number
  completedLessons?: number
  // Stats for public courses
  rating?: number
  averageRating?: number // Add averageRating property
  enrolledCount?: number
  enrollmentCount?: number // Add enrollmentCount as an alias
}

export type CourseFilter = "all" | "in-progress" | "completed" | "not-started"

// Change CourseCategory to be more dynamic by using string type
export type CourseCategory = string
