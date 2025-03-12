import type { TranscriptSegment } from "./youtube";

export interface CoursePrerequisite {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface CourseLearningOutcome {
  title: string;
  description: string;
  category: 'skill' | 'knowledge' | 'tool';
}

export interface CourseResource {
  title: string;
  type: 'article' | 'video' | 'code' | 'document';
  url: string;
  description: string;
}

export interface CourseTest {
  id: string;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  passingScore: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
  isLocked: boolean;
  unlockCondition?: {
    type: 'section' | 'lesson' | 'test';
    id: string;
  };
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  content: string;
  isLocked: boolean;
  resources: CourseResource[];
  test?: CourseTest;
}

export interface CourseSection {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: CourseLesson[];
  isLocked: boolean;
}

export interface CourseOverview {
  description: string;
  prerequisites: CoursePrerequisite[];
  learningOutcomes: CourseLearningOutcome[];
  totalDuration: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  tools: string[];
}

export interface CourseGenerationResult {
  title: string;
  subtitle: string;
  overview: CourseOverview;
  sections: CourseSection[];
  resources: CourseResource[];
}

export interface CourseGenerationRequest {
  videoId: string;
  videoDetails: {
    title: string;
    duration: string;
    description: string;
  };
}

export interface CourseGenerationProgress {
  phase: number;
  progress: number;
  message: string;
}

export interface CourseGenerationError {
  code: string;
  message: string;
  details?: {
    retryAfter?: number;
    tokenLimit?: number;
    currentTokens?: number;
  };
}

export interface CoursePartResult {
  sections: CourseSection[];
}

export interface ChunkProcessingOptions {
  maxTokens?: number;
  maxChunks?: number;
  overlapTokens?: number;
  minChunkSize?: number;
}

export interface RateLimitOptions {
  maxConcurrent?: number;
  baseDelay?: number;
  maxDelay?: number;
  maxRetries?: number;
  onProgress?: (processed: number, total: number) => void;
}

export type ProcessingProgress = {
  processed: number;
  total: number;
  currentPhase: string;
  estimatedTimeRemaining?: number;
};

export interface TranscriptChunk {
  text: string[];
  startOffset: number;
  endOffset: number;
  duration: number;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

export interface CourseTab {
  id: 'overview' | 'lessons' | 'resources' | 'tests';
  title: string;
  icon: string;
}

export interface CourseProgress {
  completedLessons: string[];
  completedTests: string[];
  currentLesson?: string;
  testScores: Record<string, number>;
}