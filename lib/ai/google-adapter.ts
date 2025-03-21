import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText, type Message } from 'ai';
import type { Tool, ToolSet, ToolCallUnion, ToolResultUnion } from 'ai';
import { logger } from './debug-logger';

export interface GoogleAIOptions {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  topP?: number;
  topK?: number;
}

/**
 * Create a Google AI provider instance
 */
export function createGoogleProvider(apiKey: string, options: GoogleAIOptions = {}) {
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  return google(options.model || 'gemini-1.5-pro-latest', {
    temperature: options.temperature,
    maxOutputTokens: options.maxOutputTokens,
    topP: options.topP,
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
    structuredOutputs: true
  });
}

export interface GoogleTextOptions<T extends ToolSet> {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  tools?: T;
  systemPrompt?: string;
}

/**
 * Generate text using the Google AI provider
 */
export async function generateGoogleText<T extends ToolSet>(
  provider: ReturnType<typeof createGoogleProvider>,
  options: GoogleTextOptions<T>
) {
  try {
    const result = await generateText({
      model: provider,
      messages: options.messages,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      tools: options.tools,
      system: options.systemPrompt
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls as Array<ToolCallUnion<T>>,
      toolResults: result.toolResults as Array<ToolResultUnion<T>>,
      usage: result.usage
    };
  } catch (error) {
    logger.error('google', 'Text generation failed', error);
    throw error instanceof Error ? error : new Error('Text generation failed');
  }
}

/**
 * Stream text using the Google AI provider
 */
export async function streamGoogleText<T extends ToolSet>(
  provider: ReturnType<typeof createGoogleProvider>,
  options: GoogleTextOptions<T>
) {
  try {
    console.log('Starting stream with options:', {
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
      toolCount: options.tools ? Object.keys(options.tools).length : 0
    });
    
    // Ensure temperature is within valid range
    const temperature = typeof options.temperature === 'number' && options.temperature >= 0 && options.temperature <= 1 
      ? options.temperature 
      : 0.7;
    
    const result = await streamText({
      model: provider,
      messages: options.messages,
      maxTokens: options.maxTokens,
      temperature,
      topP: options.topP,
      tools: options.tools,
      system: options.systemPrompt
    });

    console.log('Stream created successfully');
    return result;
  } catch (error) {
    logger.error('google', 'Stream generation failed', error);
    throw error instanceof Error ? error : new Error('Stream generation failed');
  }
}
