/**
 * This file contains type definitions to replace Convex-generated types
 * These are temporary until a proper Supabase implementation is created
 */

// Replacement for Convex Id type
export type Id<T extends string> = string;

// Base document type
export interface Doc {
  id: string;
  createdAt: number;
}

// Course types
export interface Course extends Doc {
  title: string;
  description: string;
  videoId: string;
  youtubeUrl: string;
  thumbnail?: string;
  isPublic: boolean;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration?: number;
  estimatedHours?: number;
  tags?: string[];
  category?: string;
  metadata?: any;
}

// Assessment types
export interface Assessment extends Doc {
  courseId: Id<"courses">;
  title: string;
  description: string;
  type: 'quiz' | 'project' | 'assignment';
  questions?: any[];
  instructions?: string;
  projectRequirements?: string[];
  submissionType?: string;
  resources?: {
    title: string;
    url: string;
    type: string;
  }[];
  deadline?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime?: number;
  passingScore?: number;
  allowRetries?: boolean;
  maxRetries?: number;
}

// Progress types
export interface Progress extends Doc {
  userId: string;
  assessmentId: Id<"assessments">;
  status: 'not_started' | 'in_progress' | 'completed' | 'graded';
  score?: number;
  feedback?: any;
  submission?: any;
  startedAt?: number;
  completedAt?: number;
  attemptNumber?: number;
  timeSpent?: number;
}

// Video types
export interface Video extends Doc {
  youtubeId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  channelId?: string;
  channelName?: string;
  channelAvatar?: string;
  views?: string;
  likes?: string;
  publishDate?: string;
  transcript?: any;
  cachedAt: number;
}

// Project submission types
export interface ProjectSubmission extends Doc {
  userId: string;
  assessmentId: Id<"assessments">;
  submissionUrl?: string;
  fileIds?: string[];
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  feedback?: string;
  grade?: number;
  submittedAt: number;
  reviewedAt?: number;
  reviewerNotes?: string;
  revisionCount?: number;
}
