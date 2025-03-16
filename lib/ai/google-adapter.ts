import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText, type Message } from 'ai';
import type { Tool, ToolSet, ToolCallUnion, ToolResultUnion } from 'ai';

export interface GoogleAIOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

// Create a provider instance with configured safety settings
export function createGoogleProvider(apiKey: string, options?: GoogleAIOptions) {
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  return google('gemini-1.5-pro-latest', {
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

// Helper function to generate text using the provider
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
    throw error instanceof Error ? error : new Error('Text generation failed');
  }
}

// Helper function to stream text using the provider
export async function streamGoogleText<T extends ToolSet>(
  provider: ReturnType<typeof createGoogleProvider>,
  options: GoogleTextOptions<T>
) {
  try {
    const result = await streamText({
      model: provider,
      messages: options.messages,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      tools: options.tools,
      system: options.systemPrompt
    });

    return result;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Stream generation failed');
  }
}

// Helper function to format messages for the Google provider
export function formatGoogleMessages(messages: Message[]) {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: Array.isArray(msg.content)
      ? msg.content.map(part => 
          'type' in part && part.type === 'text' 
            ? { text: part.text }
            : { text: String(part) }
        )
      : [{ text: String(msg.content) }],
    createdAt: msg.createdAt
  }));
}
