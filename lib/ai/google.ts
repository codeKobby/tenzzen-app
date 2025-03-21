import { google } from '@ai-sdk/google';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createDataStreamResponse, streamText } from 'ai';
import { AI_CONFIG } from './config';
import { logger } from './debug-logger';
import { rateLimiter } from './rate-limiter';
import type { StreamEvent } from '@/lib/ai/types/stream';

interface GenerateOptions {
  abortSignal?: AbortSignal;
  stream?: boolean;
  onProgress?: (event: {
    type: 'start' | 'progress' | 'done';
    progress?: number;
    data?: any;
  }) => Promise<void>;
}

// Initialize Google AI model with Vercel AI SDK
const model = google('gemini-1.5-pro-latest', {
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
});

// Helper for content generation
export async function generateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<Response> {
  const { abortSignal, stream = false, onProgress } = options;
  const tokenEstimate = rateLimiter.estimateTokens(prompt);

  const performGeneration = async () => {
    try {
      if (stream) {
        return createDataStreamResponse({
          async execute(dataStream) {
            try {
              // Initialize generation
              dataStream.writeData({ status: 'initializing' });
              if (onProgress) {
                await onProgress({ type: 'start', progress: 0 });
              }

              // Set up streaming with Vercel AI SDK
              const result = await streamText({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: AI_CONFIG.temperature,
                maxTokens: AI_CONFIG.maxTokens,
                topP: AI_CONFIG.topP,
                onChunk: async (chunk) => {
                  if (abortSignal?.aborted) {
                    throw new Error('Generation cancelled');
                  }

                  const text = chunk.content || '';
                  const progress = Math.min(Math.round((text.length / 1000) * 90), 90);

                  dataStream.writeMessageAnnotation({
                    progress,
                    chunk: text
                  });

                  if (onProgress) {
                    await onProgress({
                      type: 'progress',
                      progress,
                      data: text
                    });
                  }
                }
              });

              // Merge AI stream into data stream
              result.mergeIntoDataStream(dataStream);

              // Write completion data
              dataStream.writeData({
                status: 'completed',
                progress: 100
              });

              if (onProgress) {
                await onProgress({
                  type: 'done',
                  progress: 100
                });
              }

            } catch (error) {
              logger.error('google', 'Generation error:', error);
              const message = error instanceof Error ? error.message : 'Unknown error occurred';
              dataStream.writeData({ error: message });
              throw error;
            }
          },
          onError(error) {
            return error instanceof Error ? error.message : 'Generation failed';
          },
        });
      }

      // For non-streaming responses, use streamText but wait for completion
      const result = await streamText({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: AI_CONFIG.temperature,
        maxTokens: AI_CONFIG.maxTokens,
        topP: AI_CONFIG.topP,
      });

      const text = await result.text();
      return new Response(text, {
        headers: { 'Content-Type': 'text/plain' },
      });

    } catch (error) {
      logger.error('google', 'Generation error:', error);
      throw error;
    }
  };

  return rateLimiter.withRetry(
    performGeneration,
    tokenEstimate,
    'generate-content'
  );
}
