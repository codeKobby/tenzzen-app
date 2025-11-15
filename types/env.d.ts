declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_APP_URL: string;
      
      // Google AI configuration
      GOOGLE_GENERATIVE_AI_API_KEY: string;
      GOOGLE_GENERATIVE_AI_BASE_URL?: string;

      // YouTube API
      YOUTUBE_API_KEY: string;
    }
  }
}

// Schema for validating environment variables
export const envSchema = {
  required: [
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'YOUTUBE_API_KEY'
  ],
  optional: {
    GOOGLE_GENERATIVE_AI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta'
  }
} as const;

// Ensure this file is treated as a module
export {};