export interface Course {
  id: string
  title: string
  description: string
  duration: string
  progress: number
  rating: number
  instructor: string
  category: string
  thumbnail?: string
  lastAccessed?: string
  totalLessons?: number
  completedLessons?: number
}

export type CourseFilter = "all" | "in-progress" | "completed" | "not-started"
export type CourseCategory = "all" | "programming" | "design" | "business"