import { createDataStream, streamText } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getVideoDetails } from '@/actions/getYoutubeData';
import { getYoutubeTranscript } from '@/actions/getYoutubeTranscript';
import { generateCourseFromVideo } from '@/tools/course-generator';
import { logger } from '@/lib/ai/debug-logger';
import { rateLimiter } from '@/lib/ai/rate-limiter';
import { GoogleAIAdapter } from '@/lib/ai/google-adapter';
import type { ToolCallEvent, ToolResultEvent } from 'ai';

// Configure runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable');
}

// Initialize model with adapter
const model = new GoogleAIAdapter(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// Request validation
const requestSchema = z.object({
  videoId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  // Create data stream
  const { stream, writer } = createDataStream();

  try {
    // Parse and validate request
    const body = await request.json();
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

    // Create stream
    const result = streamText({
      model,
      maxSteps: 3,
      tools: {
        generateCourse: generateCourseFromVideo
      },
      messages: [
        {
          role: 'system',
          content: 'You are a professional course creator and instructor. Generate a comprehensive course structure from the provided video content.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Create a detailed course structure from this video content:\n\n` +
                `Title: ${videoData.title}\n` +
                `Description: ${videoData.description}\n` +
                `Duration: ${videoData.duration}\n` +
                `Transcript:\n${transcript}\n\n` +
                `Please analyze the content and create a well-structured course with clear learning objectives, ` +
                `prerequisites, and a logical progression of lessons. Ensure each section has a clear purpose ` +
                `and builds on previous knowledge.`
            }
          ]
        }
      ],
      onToolCall: (event: ToolCallEvent) => {
        writer.write({
          type: 'tool-status',
          toolCallId: event.toolCallId,
          status: 'in-progress'
        });
      },
      onToolResult: (event: ToolResultEvent) => {
        writer.write({
          type: 'tool-status',
          toolCallId: event.toolCallId,
          status: 'complete'
        });
      },
      onError: (error: Error) => {
        logger.error('state', 'Stream error', error);
      }
    });

    // Create response headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-RateLimit-Remaining': limits.remainingRequests.toString(),
      'X-RateLimit-Reset': Math.ceil(limits.resetIn / 1000).toString()
    };

    // Return stream response
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.fullStream) {
              if ('error' in chunk) {
                controller.enqueue(
                  `data: ${JSON.stringify({ 
                    error: chunk.error instanceof Error ? chunk.error.message : 'An error occurred' 
                  })}\n\n`
                );
                continue;
              }
              controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
        cancel() {
          writer.close();
        }
      }),
      { headers }
    );

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
  } finally {
    writer.close();
  }
}
