import type { Message } from 'ai';

// Progress events
export interface ProgressEvent {
  type: 'start' | 'progress' | 'done';
  progress?: number;
  data?: any;
}

// Progress callback
export type ProgressCallback = (event: ProgressEvent) => Promise<void>;

// Stream chunk
export interface StreamChunk<T> {
  type: 'partial' | 'done';
  data?: Partial<T>;
  error?: string;
}

// Base options for generation
export interface AIOptions {
  abortSignal?: AbortSignal;
  onProgress?: ProgressCallback;
}

// Configuration
export interface AIConfiguration {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

// Error response shape
export interface AIError {
  error: string;
  message: string;
  status: number;
  type: 'rate_limit' | 'token_limit' | 'validation' | 'generation' | 'unknown';
}

// Combine options
export interface AIGenerateOptions extends AIOptions {
  stream?: boolean;
  config?: Partial<AIConfiguration>;
}
