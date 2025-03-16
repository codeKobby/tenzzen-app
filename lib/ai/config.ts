export const AI_CONFIG = {
  model: 'gemini-pro',
  temperature: 0.7,
  maxRetries: 3,
  streamChunkSize: 1024,
  timeoutMs: 60000,
  rateLimits: {
    tokensPerMinute: 30000,
    requestsPerMinute: 20
  }
} as const;

export const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
  candidateCount: 1,
  stopSequences: [],
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
} as const;

export const PROGRESS_PHASES = [
  { threshold: 0, message: 'Preparing to generate course...' },
  { threshold: 5, message: 'Analyzing video content...' },
  { threshold: 15, message: 'Identifying key topics...' },
  { threshold: 25, message: 'Structuring course outline...' },
  { threshold: 40, message: 'Generating learning objectives...' },
  { threshold: 50, message: 'Creating lesson plans...' },
  { threshold: 65, message: 'Adding exercises and tests...' },
  { threshold: 80, message: 'Finding relevant resources...' },
  { threshold: 90, message: 'Finalizing course structure...' },
  { threshold: 95, message: 'Almost done...' },
  { threshold: 100, message: 'Course generated successfully!' }
] as const;

export const ERROR_MESSAGES = {
  rateLimit: 'Rate limit exceeded. Please try again in a moment.',
  timeout: 'Request timed out. Please try again.',
  cancelled: 'Generation was cancelled.',
  network: 'Network error. Please check your connection.',
  unknown: 'An unexpected error occurred.',
  invalidResponse: 'Received invalid response from AI.',
  safety: 'Content safety check failed.',
  contextLimit: 'Input too long. Please try with shorter content.',
  noTranscript: 'Could not extract video transcript.',
  validation: 'Generated content failed validation.'
} as const;

export function getProgressMessage(progress: number): string {
  const phase = [...PROGRESS_PHASES]
    .reverse()
    .find(phase => progress >= phase.threshold);
  return phase?.message || PROGRESS_PHASES[0].message;
}

export const STREAM_EVENTS = {
  start: 'start',
  content: 'content',
  tool: 'tool-result',
  progress: 'progress',
  error: 'error',
  finish: 'finish'
} as const;

export const TOOL_NAMES = {
  generateCourse: 'generateCourse',
  suggestResources: 'suggestResources',
  validateContent: 'validateContent'
} as const;

export const SAFETY_CATEGORIES = {
  hate: 'HARM_CATEGORY_HATE_SPEECH',
  harassment: 'HARM_CATEGORY_HARASSMENT',
  sexualContent: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  dangerous: 'HARM_CATEGORY_DANGEROUS_CONTENT'
} as const;

export const SAFETY_THRESHOLDS = {
  negligible: 0.2,
  low: 0.4,
  medium: 0.6,
  high: 0.8
} as const;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for known error types
    if (error.name === 'AbortError') {
      return ERROR_MESSAGES.cancelled;
    }
    if (error.name === 'TimeoutError') {
      return ERROR_MESSAGES.timeout;
    }
    if (error.message.includes('rate limit')) {
      return ERROR_MESSAGES.rateLimit;
    }
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return ERROR_MESSAGES.unknown;
}

// Type definitions
export type ErrorType = keyof typeof ERROR_MESSAGES;
export type ToolName = keyof typeof TOOL_NAMES;
export type StreamEventType = keyof typeof STREAM_EVENTS;
export type SafetyCategory = keyof typeof SAFETY_CATEGORIES;