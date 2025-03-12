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

export const config = {
  temperature: 0.7,
  model: "gpt-4-turbo",
};