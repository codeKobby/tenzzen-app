import { type Message } from 'ai';

/**
 * Google AI Safety Settings Types
 */
export interface SafetySetting {
  category: SafetyCategory;
  threshold: SafetyThreshold;
}

export type SafetyCategory =
  | 'HARM_CATEGORY_HARASSMENT'
  | 'HARM_CATEGORY_HATE_SPEECH'
  | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
  | 'HARM_CATEGORY_DANGEROUS_CONTENT';

export type SafetyThreshold =
  | 'BLOCK_NONE'
  | 'BLOCK_ONLY_HIGH'
  | 'BLOCK_MEDIUM_AND_ABOVE'  
  | 'BLOCK_LOW_AND_ABOVE';

/**
 * Core Configuration Types
 */
export interface AIConfiguration {
  temperature?: number;
  topP?: number; 
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  safetySettings?: SafetySetting[];
}

/**
 * Stream Context Types
 */ 
export interface StreamContext {
  messages: Message[];
  abortSignal?: AbortSignal;
  tools?: Record<string, any>;
}

/**
 * Tool Related Types
 */
export type FunctionParameters = Record<string, any>;

export type ToolCallHandler = (name: string, args: FunctionParameters) => Promise<any>;

export interface ToolCallContext {
  name: string;
  args: FunctionParameters;
}

export interface ToolCallResult {
  name: string;
  result: any;
}

/**
 * Course Generation Types
 */
export interface CourseGenerationConfig extends AIConfiguration {
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxSteps?: number;
}

export interface CourseContent {
  title: string;
  description: string;
  sections: CourseSection[];
}

export interface CourseSection {
  title: string;
  content: string[];
  exercises?: Exercise[];
}

export interface Exercise {
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}
