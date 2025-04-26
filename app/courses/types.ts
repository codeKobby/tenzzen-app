export interface Course {
  id: string
  title: string
  description: string
  duration?: string
  progress: number
  category: string
  thumbnail?: string
  image?: string // Add image property
  // Add new video detail fields
  channelName?: string
  channelAvatar?: string
  viewCount?: number | string // Use string to accommodate formatted numbers like "1.2M"
  likeCount?: number | string // Use string for formatted numbers
  publishedDate?: string | number | Date // Date the video was published
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
  // Add sections property to match the course data structure
  sections?: Array<{
    title: string
    lessons: Array<{
      id: string
      title: string
      content?: string
      duration?: number
      videoId?: string
      completed?: boolean
    }>
    duration?: number
  }>
  lessonsCompleted?: number
  isNew?: boolean
}

export type CourseFilter = "all" | "in-progress" | "completed" | "not-started"

// Change CourseCategory to be more dynamic by using string type
export type CourseCategory = string
