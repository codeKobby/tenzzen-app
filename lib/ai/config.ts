export const API_ROUTE = '/api/ai/v1';

export const GENERATION_CONFIG = {
  maxRetries: 2,
  initialDelay: 1000, // 1 second
  maxGenerationTime: 120000, // 2 minutes
  progressUpdateInterval: 2000, // 2 seconds
};

export const GENERATION_PHASES = [
  {
    name: 'Analyzing content',
    progress: 25,
  },
  {
    name: 'Structuring course outline',
    progress: 50,
  },
  {
    name: 'Creating practice questions',
    progress: 75,
  },
  {
    name: 'Finalizing course content',
    progress: 100,
  },
];

export const ERROR_MESSAGES = {
  TRANSCRIPT_FETCH: 'Failed to fetch video transcript',
  COURSE_GENERATION: 'Failed to generate course content',
  CONTENT_ANALYSIS: 'Error analyzing video content',
  REQUEST_TIMEOUT: 'Request timed out',
  USER_CANCEL: 'Course generation cancelled',
} as const;

export const AI_MODEL_CONFIG = {
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxRetries: 2,
  timeout: 120000,
  structuredOutputs: true,
} as const;

export const DEFAULT_PROGRESS_STATE = {
  currentPhase: 0,
  progress: 0,
  error: null,
  cancelled: false,
} as const;