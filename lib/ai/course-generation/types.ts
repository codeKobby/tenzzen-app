export interface CourseGenerationProgress {
  step: 'initializing' | 'fetching_transcript' | 'analyzing' | 'generating' | 'structuring' | 'finalizing' | 'completed';
  progress: number; // 0-100
  message: string;
}

export interface CourseResource {
  title: string;
  url: string;
  description?: string;
  type?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  content?: string;
  duration?: string;
  keyPoints?: string[];
  resources?: CourseResource[];
  startTimestamp?: number;
  endTimestamp?: number;
}

export interface CourseSection {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  assessments?: CourseAssessment[];
}

export interface CourseAssessment {
  id: string;
  title: string;
  type: 'quiz' | 'test' | 'assignment' | 'project';
  description: string;
  isLocked: boolean;
  questions?: CourseQuestion[];
  instructions?: string;
  estimatedDuration?: string;
}

export interface CourseQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'written' | 'fill-in-blank';
  options?: string[];
  correctAnswer?: string | number | string[];
  explanation?: string;
}

export interface CourseOverview {
  description: string;
  prerequisites: string[];
  learningOutcomes: string[];
  totalDuration: string;
  difficultyLevel: string;
  skills: string[];
  tools?: string[];
}

export interface CourseMetadata {
  category?: string;
  subcategory?: string;
  difficulty: string;
  duration: string;
  objectives?: string[];
  prerequisites?: string[];
  targetAudience?: string[];
  sources?: any[]; // For UI display
}

export interface Course {
  title: string;
  subtitle?: string;
  description: string;
  videoId?: string;
  thumbnail?: string;
  overview: CourseOverview;
  metadata: CourseMetadata;
  sections: CourseSection[];
}
