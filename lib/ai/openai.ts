import OpenAI from 'openai';
import { createOpenAI } from '@ai-sdk/openai';

// Create an instance for direct API access
export const openaiApi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an instance for Vercel AI SDK
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});

// Helper function to handle rate limits with exponential backoff
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Rate limit") &&
        attempt < maxRetries
      ) {
        lastError = error;
        // Extract wait time from error message or use default backoff
        const waitTime = 
          parseInt(error.message.match(/try again in (\d+\.?\d*)s/)?.[1] ?? "2") * 1000;
        
        // Add some jitter to prevent all retries happening at exactly the same time
        const jitter = Math.random() * 1000;
        
        // Wait for the specified time plus jitter
        await new Promise(resolve => 
          setTimeout(resolve, waitTime + jitter)
        );
        
        continue;
      }
      throw error;
    }
  }
  
  throw lastError || new Error('Maximum retries exceeded');
}

export const AI_CONFIG = {
  temperature: 0.7,
  model: "gpt-4-turbo",
  maxRetries: 3,
  retryDelay: 2000, // Base delay in ms
  maxDelay: 10000, // Maximum delay in ms
  timeout: 120000, // 2 minutes
} as const;