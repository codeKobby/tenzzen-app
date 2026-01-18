export interface Course {
  id: string;
  title: string;
  description: string;
  duration?: string;
  progress: number;
  category: string;
  thumbnail?: string;
  image?: string; // Add image property
  // Add new video detail fields
  channelName?: string;
  channelAvatar?: string;
  viewCount?: number | string; // Use string to accommodate formatted numbers like "1.2M"
  likeCount?: number | string; // Use string for formatted numbers
  publishedDate?: string | number | Date; // Date the video was published
  lastAccessed?: string | number | Date;
  videoSource?: string;
  videoId?: string; // Add videoId property for compatibility
  instructor?: string;
  isPublic?: boolean;
  isEnrolled?: boolean; // Add isEnrolled property
  enrolledAt?: string | number | Date; // Add enrolledAt property for enrollment date
  sources?: Array<{
    name: string;
    avatar: string;
  }>;
  metadata?: {
    duration?: string | number;
    category?: string;
    prerequisites?: string[];
    objectives?: string[];
    targetAudience?: string[];
    sources?: any[];
    difficulty?: string;
    courseItems?: any[]; // Add courseItems to metadata type
  };
  topics?: {
    current: number;
    total: number;
    currentTitle: string;
  };
  totalLessons?: number;
  completedLessons?: number | string[] | any[];
  // Stats for public courses
  rating?: number;
  averageRating?: number; // Add averageRating property
  enrolledCount?: number;
  enrollmentCount?: number; // Add enrollmentCount as an alias
  // Add sections property to match the course data structure
  sections?: Array<{
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      content?: string;
      duration?: number;
      videoId?: string;
      completed?: boolean;
    }>;
    duration?: number;
  }>;
  courseItems?: any[]; // Optional courseItems for backward compatibility
  lessonsCompleted?: number;
  isNew?: boolean;
  estimatedHours?: number; // Add estimatedHours property for duration calculation
  durationMinutes?: number; // Add durationMinutes property for YouTube-style duration format
  estimated_duration?: string | number; // Add estimated_duration property from database (interval as string)

  // Standardized fields for consistent data handling
  duration_seconds?: number; // Standardized duration field in seconds
  total_lessons?: number; // Standardized total lessons count

  // Database fields that might be accessed directly
  video_id?: string;
  tags?: string[] | any[];
  course_items?: any[];
  duration_minutes?: number;
  estimated_hours?: number;

  // Engagement and Trust
  trustScore?: number;
  upvoteCount?: number;
  forkedFrom?: string;
}

export type CourseFilter = "all" | "in-progress" | "completed" | "not-started";

// Change CourseCategory to be more dynamic by using string type
export type CourseCategory = string;
