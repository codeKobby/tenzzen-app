import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google'; // Use Vercel AI SDK Google provider
import { generateText } from 'ai'; // Use Vercel AI SDK generateText
import { createAILogger } from '@/lib/ai/debug-logger';

// Create a logger for this API route
const logger = createAILogger('GoogleAIKeyVerificationAPI');

/**
 * API endpoint to verify Google AI API key
 */
export async function GET() {
  logger.debug('Received API key verification request.');
  try {
    // Get API key from environment variables - SDK will use this automatically
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      logger.error('Google AI API key is not configured in environment variables.');
      return NextResponse.json(
        { valid: false, error: 'Google AI API key is not configured.' },
        { status: 500 }
      );
    }

    logger.debug('Attempting to verify key using Vercel AI SDK...');

    // Use generateText with a minimal prompt to test the connection and key
    // The SDK handles passing the API key from the environment implicitly
    await generateText({
      model: google('gemini-1.5-flash-latest'), // Use a fast model
      prompt: 'Hi', // Simple prompt
      maxTokens: 5, // Limit response tokens
    });

    // If generateText completes without throwing, the key is valid
    logger.info('Google AI API key verification successful via Vercel AI SDK.');
    return NextResponse.json({
      valid: true,
      message: 'API key is valid and connection successful.',
    });

  } catch (error: any) {
    // Log the specific error from the SDK
    logger.error('Google AI API key verification failed.', {
      errorMessage: error.message,
      errorDetails: error.cause || error.stack, // Include more details if available
    });

    // Provide a more specific error message if possible
    let errorMessage = 'API key verification failed.';
    let status = 403; // Default to Forbidden/Auth error

    if (error.message?.includes('API key not valid')) {
      errorMessage = 'The provided Google AI API key is invalid.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please check your Google Cloud project billing.';
      status = 429; // Too Many Requests
    } else if (error.message?.includes('permission denied')) {
      errorMessage = 'API key lacks permissions for the requested model or operation.';
    } else if (error.message?.includes('fetch failed') || error.message?.includes('network error')) {
       errorMessage = 'Network error while trying to reach Google AI services.';
       status = 503; // Service Unavailable
    }

    return NextResponse.json(
      {
        valid: false,
        error: errorMessage,
        details: error.message, // Include the original error message for debugging
      },
      { status: status } // Use appropriate status code
    );
  }
}

// Helper function to mask API key for logging (optional)
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return 'Invalid or too short key';
  }
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }
// Removed extra closing brace from here
