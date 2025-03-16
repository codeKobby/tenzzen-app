import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getVideoDetails } from '@/actions/getYoutubeData';
import { getYoutubeTranscript } from '@/actions/getYoutubeTranscript';
import { generateCourseFromVideo } from '@/tools/course-generator';
import { logger } from '@/lib/ai/debug-logger';
import { rateLimiter } from '@/lib/ai/rate-limiter';
import { createGoogleProvider, streamGoogleText } from '@/lib/ai/google-adapter';
import type { Message, ToolSet } from 'ai';
import { createDataStreamResponse } from 'ai';

// Handle edge runtime compilation of node modules
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable');
}

// Initialize provider
const provider = createGoogleProvider(process.env.GOOGLE_GENERATIVE_AI_API_KEY, {
  temperature: 0.7,
  maxOutputTokens: 2048
});

// Define course generation tools
const courseTools = {
  generateCourse: generateCourseFromVideo
} as const satisfies ToolSet;

// Request validation
const requestSchema = z.object({
  videoId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const { videoId } = requestSchema.parse(body);

    // Fetch video data and transcript in parallel
    const [videoData, transcript] = await Promise.all([
      getVideoDetails(videoId),
      getYoutubeTranscript(videoId)
    ]);

    if (!videoData) {
      throw new Error('Failed to fetch video details');
    }

    if (!transcript) {
      throw new Error('No transcript available for this video');
    }

    // Calculate token estimation
    const contentForEstimation = `${videoData.title}\n${videoData.description}\n${transcript}`;
    const tokenEstimate = rateLimiter.estimateTokens(contentForEstimation);

    // Check rate limits
    const limits = rateLimiter.getCurrentLimits();
    if (limits.remainingRequests <= 0 || limits.remainingTokens < tokenEstimate) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          details: {
            retryAfter: Math.ceil(limits.resetIn / 1000)
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(limits.resetIn / 1000).toString()
          }
        }
      );
    }

    // Log generation start
    logger.info('state', 'Starting course generation', {
      videoId,
      title: videoData.title,
      transcriptLength: transcript.length,
      estimatedTokens: tokenEstimate
    });

    // Set up messages for course generation
    const messages: Message[] = [
      {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'You are a professional course creator and instructor. Generate a comprehensive course structure from the provided video content.',
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Create a detailed course structure from this video content:\n\n` +
          `Title: ${videoData.title}\n` +
          `Description: ${videoData.description}\n` +
          `Duration: ${videoData.duration}\n` +
          `Transcript:\n${transcript}\n\n` +
          `Please analyze the content and create a well-structured course with clear learning objectives, ` +
          `prerequisites, and a logical progression of lessons. Ensure each section has a clear purpose ` +
          `and builds on previous knowledge.`,
        createdAt: new Date()
      }
    ];

    // Create response headers
    const headers = {
      'X-RateLimit-Remaining': limits.remainingRequests.toString(),
      'X-RateLimit-Reset': Math.ceil(limits.resetIn / 1000).toString()
    };

    // Return streaming response
    return createDataStreamResponse({
      headers,
      execute: async (dataStream) => {
        try {
          // Write initial status
          dataStream.writeData({ status: 'initializing' });

          // Create stream
          const result = await streamGoogleText(provider, {
            messages,
            tools: courseTools,
            maxTokens: 2048,
            temperature: 0.7,
            systemPrompt: 'You are a professional course creator and instructor'
          });

          // Write generation started status
          dataStream.writeData({ status: 'generating' });

          // Process the full stream to handle all types of events
          for await (const chunk of result.fullStream) {
            switch (chunk.type) {
              case 'text-delta':
                dataStream.writeData({ 
                  status: 'generating',
                  text: chunk.textDelta 
                });
                break;

              case 'tool-call':
                dataStream.writeData({ 
                  status: 'using-tool',
                  toolCall: {
                    id: chunk.toolCallId,
                    name: chunk.toolName,
                    args: chunk.args
                  }
                });
                break;

              case 'tool-result':
                dataStream.writeData({ 
                  status: 'tool-result',
                  toolResult: chunk.result
                });
                break;

              case 'error':
                throw chunk.error;
            }
          }

          // Write completion status
          dataStream.writeData({ status: 'complete' });

        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('state', 'Course generation error', err);
          throw err;
        }
      },
      onError: (error) => {
        // Convert error to string message for client
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('state', 'Course generation error response', err);
        return err.message;
      }
    });

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Course generation failed');
    logger.error('state', 'Course generation failed', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message
      }),
      { 
        status: err instanceof z.ZodError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
