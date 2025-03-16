import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/ai/debug-logger';

// Simple environment check
function checkRequiredEnvVars() {
  const required = [
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'YOUTUBE_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const error = new Error('Missing required environment variables');
    error.name = 'ConfigurationError';
    logger.error('state', error.message, error);
    return false;
  }

  return true;
}

export function middleware(request: NextRequest) {
  // Skip validation for non-API routes
  if (!request.url.includes('/api/')) {
    return NextResponse.next();
  }

  // Validate environment variables
  if (!checkRequiredEnvVars()) {
    return new NextResponse(
      JSON.stringify({
        error: 'Server configuration error',
        message: 'Missing required environment variables'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
