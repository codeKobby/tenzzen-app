export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CourseSection {
  title: string;
  summary: string;
  timeframe?: string;
  keyPoints: string[];
  quiz?: QuizQuestion[];
}

export interface CourseGenerationResult {
  title: string;
  description: string;
  sections: CourseSection[];
}

export interface CourseGenerationError {
  message: string;
  code?: string;
}

// Course Generation Request Types
export interface CourseGenerationRequest {
  videoId: string;
  videoDetails: {
    title: string;
    duration: string | number;
    description: string;
  };
}

// Course Generation Response Types
export interface CourseGenerationResponse {
  course: CourseGenerationResult;
}

export interface CourseGenerationErrorResponse {
  error: CourseGenerationError;
}