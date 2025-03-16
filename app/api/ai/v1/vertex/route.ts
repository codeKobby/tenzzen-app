import { NextRequest } from 'next/server';
import { generateContent } from '@/lib/ai/vertex';
import { createAIError, createErrorResponse } from '@/lib/ai/error';
import { logger } from '@/lib/ai/debug-logger';
import { z } from 'zod';

// Validate request body
const requestSchema = z.object({
  prompt: z.string().min(1),
  options: z.object({
    maxTokens: z.number().optional(),
    temperature: z.number().min(0).max(1).optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Check environment configuration
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      logger.error('api', 'Missing Google credentials', new Error('Google Cloud credentials not configured'));
      return createErrorResponse('configuration', 400, {
        message: 'Google Cloud credentials not configured'
      });
    }

    // Parse request body
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return createErrorResponse('invalidRequest', 400, {
        message: 'Invalid request body'
      });
    }

    // Validate request schema
    const result = requestSchema.safeParse(rawBody);
    if (!result.success) {
      return createErrorResponse('validationFailed', 400, {
        errors: result.error.issues
      });
    }

    const { prompt, options } = result.data;

    // Start generation with abort signal
    const controller = new AbortController();
    request.signal.addEventListener('abort', () => controller.abort());

    const response = await generateContent(prompt, {
      abortSignal: controller.signal
    });

    if (!response.result) {
      return createErrorResponse('emptyResponse', 500);
    }

    // Return successful response
    return new Response(
      JSON.stringify({ result: response.result }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    // Convert unknown error to Error type
    const knownError = error instanceof Error ? error : new Error(
      typeof error === 'string' ? error : 'Unknown error occurred'
    );

    // Handle known error types
    if (knownError.message.includes('quota') || knownError.message.includes('rate limit')) {
      logger.error('api', 'Rate limit exceeded', knownError);
      return createErrorResponse('rateLimit', 429);
    }

    if (knownError.message.includes('credentials')) {
      logger.error('api', 'Authentication failed', knownError);
      return createErrorResponse('authentication', 401);
    }

    if (knownError.message.includes('network')) {
      logger.error('api', 'Network error', knownError);
      return createErrorResponse('network', 503);
    }

    if (knownError.message.includes('safety')) {
      logger.error('api', 'Content safety violation', knownError);
      return createErrorResponse('safety', 400);
    }

    // Log and return generic error
    logger.error('api', 'Generation error', knownError);
    return createErrorResponse('generationFailed', 500, {
      message: knownError.message
    });
  }
}