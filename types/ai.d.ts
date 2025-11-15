import type { Tool } from 'ai';

// Course generation types
export type SafetySettings = Array<{
  category: string;
  threshold: string;
}>;

export interface CourseGeneratorResult {
  title: string;
  subtitle: string;
  overview: {
    description: string;
    prerequisites: Array<{
      title: string;
      description: string;
      level: 'beginner' | 'intermediate' | 'advanced';
    }>;
    learningOutcomes: Array<{
      title: string;
      description: string;
      category: 'skill' | 'knowledge' | 'tool';
    }>;
    totalDuration: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    skills: string[];
    tools: string[];
  };
  sections: Array<{
    id: string;
    title: string;
    description: string;
    duration: string;
    lessons: Array<{
      id: string;
      title: string;
      duration: string;
      description: string;
      content: string;
      isLocked: boolean;
      resources: Array<{
        title: string;
        type: 'article' | 'video' | 'code' | 'document';
        url: string;
        description: string;
      }>;
      test: {
        id: string;
        title: string;
        description: string;
        timeLimit: number;
        passingScore: number;
        questions: Array<{
          question: string;
          options: string[];
          correctAnswer: number;
          explanation: string;
        }>;
        isLocked: boolean;
      };
    }>;
    isLocked: boolean;
  }>;
}

// API Response types
export interface SafetyRating {
  category: string;
  probability: string;
  blocked?: boolean;
}

export interface GoogleMetadata {
  safetyRatings?: SafetyRating[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: CourseGeneratorResult;
}

export interface GenerationStep {
  type: string;
  content?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface GenerationResponse {
  text: string;
  steps: GenerationStep[];
  providerMetadata?: {
    google?: GoogleMetadata;
  };
}

// Rate limiting types
export interface RateLimits {
  remainingRequests: number;
  remainingTokens: number;
  resetIn: number;
}

// Error types
export interface APIErrorResponse {
  error: string;
  details?: unknown;
}

export interface AIResponse {
  result: CourseGeneratorResult;
  limits?: RateLimits;
}