import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Debug endpoint to check if the Clerk JWT template for Supabase is properly configured
 * GET /api/debug/jwt-template-check
 */
export async function GET(req: NextRequest) {
  try {
    const authData = await auth();
    const userId = authData.userId;
    const getToken = authData.getToken;

    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated',
        message: 'You must be signed in to use this endpoint'
      }, { status: 401 });
    }

    // Try to get the JWT token with the Supabase template
    let token = null;
    let tokenError = null;

    try {
      token = await getToken({ template: 'supabase' });
    } catch (error: any) {
      tokenError = {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    // If we got a token, try to decode it
    let decodedToken = null;
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          decodedToken = {
            sub: payload.sub,
            aud: payload.aud,
            role: payload.role,
            exp: payload.exp,
            iat: payload.iat,
            // Don't include sensitive information
          };
        }
      } catch (decodeError: any) {
        console.error('Error decoding token:', decodeError);
      }
    }

    return NextResponse.json({
      authenticated: true,
      userId,
      tokenAvailable: !!token,
      tokenError,
      decodedToken,
      // Include instructions for fixing if there's an issue
      help: !token ? 'Make sure you have created a JWT template named "supabase" in your Clerk dashboard' : undefined
    });
  } catch (error: any) {
    console.error('Error checking JWT template:', error);
    return NextResponse.json({
      error: 'Failed to check JWT template',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
