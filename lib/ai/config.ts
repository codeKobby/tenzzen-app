export enum AIErrorCode {
  RateLimit = 'rate_limit',
  TokenLimit = 'token_limit',
  ValidationError = 'validation_error',
  GenerationError = 'generation_error',
  StreamError = 'stream_error',
  Unknown = 'unknown'
}

export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public status: number = 500
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Configuration for AI models and parameters
 */

// Base URL for AI API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || '/api/ai';

// Configure model parameters with sensible defaults
export const AI_CONFIG = {
  // Base model parameters
  model: process.env.NEXT_PUBLIC_AI_MODEL || 'gemini-1.5-pro-latest',
  temperature: parseFloat(process.env.NEXT_PUBLIC_AI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.NEXT_PUBLIC_AI_MAX_TOKENS || '8192', 10),
  topP: parseFloat(process.env.NEXT_PUBLIC_AI_TOP_P || '0.95'),
  topK: parseInt(process.env.NEXT_PUBLIC_AI_TOP_K || '40', 10),
  
  // Course generation parameters
  courseGeneration: {
    temperature: parseFloat(process.env.NEXT_PUBLIC_COURSE_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.NEXT_PUBLIC_COURSE_MAX_TOKENS || '16384', 10)
  },
  
  // Rate limiting parameters
  rateLimit: {
    maxPerMinute: parseInt(process.env.NEXT_PUBLIC_AI_RATE_LIMIT || '10', 10),
    waitTimeout: parseInt(process.env.NEXT_PUBLIC_AI_WAIT_TIMEOUT || '30000', 10),
  },
  
  // Available models
  models: {
    google: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4-vision-preview']
  },
  
  // Endpoint paths
  endpoints: {
    completions: `${API_BASE_URL}/completions`,
    generations: `${API_BASE_URL}/generate`,
    chat: `${API_BASE_URL}/chat`,
    courseGeneration: `${API_BASE_URL}/generate-course`
  },
  
  // Features toggles
  features: {
    streamingEnabled: process.env.NEXT_PUBLIC_AI_STREAMING !== 'false',
    debugMode: process.env.NEXT_PUBLIC_AI_DEBUG === 'true',
    mockResponses: process.env.NEXT_PUBLIC_MOCK_AI === 'true'
  }
};

// Timeout helpers
export const TIMEOUTS = {
  shortRequest: 10000, // 10 seconds
  standardRequest: 30000, // 30 seconds
  longRequest: 60000, // 1 minute
  courseGeneration: 180000, // 3 minutes
};

// Safety settings for Google Generative AI
export const SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];

import { google } from '@ai-sdk/google';
import { logger } from '@/lib/ai/debug-logger';

// Define available models
export const availableModels = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
] as const;

export type AvailableModel = typeof availableModels[number];

// Configure Google AI model with safety settings
export const googleModel = google('gemini-1.5-pro-latest', {
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
});

// Default system message for educational content
export const DEFAULT_SYSTEM_MESSAGE = `You are TenzzenAI, an expert AI teaching assistant that helps create educational courses from video content.
Your goal is to analyze video content and generate structured course material that is:
- Educational and informative
- Well-organized with clear sections and lessons
- Focused on actionable learning objectives
- Suitable for self-paced learning

Always maintain a professional, educational tone. Focus on presenting information clearly and in a well-structured way.
`;

// Log AI model configuration on startup
logger.info('ai', 'AI model configuration loaded', {
  model: 'gemini-1.5-pro-latest',
  safetySettings: true
});
