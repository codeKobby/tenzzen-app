import { NextResponse } from 'next/server';
import { createAILogger } from '@/lib/ai/debug-logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Create a logger for the API endpoint
const logger = createAILogger('api-key-verification');

/**
 * API endpoint to verify if a Google AI API key is valid
 */
export async function POST(req: Request) {
  try {
    // Get API key from request headers
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header');
      return NextResponse.json(
        { valid: false, message: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }
    
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!apiKey) {
      logger.warn('No API key provided');
      return NextResponse.json(
        { valid: false, message: 'No API key provided' },
        { status: 401 }
      );
    }

    // Try to initialize the Google AI client and make a simple request
    try {
      // Initialize Google Generative AI client
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Get a simple model and make a basic request
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Make a simple request to verify the API key
      const result = await model.generateContent('Hello, this is a test to verify API key validity.');
      
      // If we get a response, the API key is valid
      logger.info('API key verification successful');
      
      return NextResponse.json({ 
        valid: true, 
        message: 'API key is valid' 
      });
    } catch (error) {
      logger.error('API key verification failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // Return specific error for invalid API key
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Invalid API key or API access issue',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 403 }
      );
    }
  } catch (error) {
    logger.error('Error during API key verification', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return NextResponse.json(
      { 
        valid: false, 
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}