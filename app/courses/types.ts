export interface Course {
  id: string
  title: string
  description: string
  duration: string
  progress: number
  category: string
  thumbnail?: string
  lastAccessed?: string
  isPublic: boolean
  sources: Array<{
    name: string
    avatar: string
  }>
  topics: {
    current: number
    total: number
    currentTitle: string
  }
  // Only available for public courses
  rating?: number
  enrolledCount?: number
}

export type CourseFilter = "all" | "in-progress" | "completed" | "not-started"
export type CourseCategory = "all" | "programming" | "design" | "business"
