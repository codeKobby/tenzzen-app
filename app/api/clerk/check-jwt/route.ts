import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const authData = await auth();
    const userId = authData.userId;
    const getToken = authData.getToken;

    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Get the JWT token with the Supabase template
    const clerkToken = await getToken({ template: 'supabase' });
    const token = clerkToken || '';

    // Decode the token to check its contents
    // This is a simple way to decode a JWT without verification
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

    return NextResponse.json({
      success: true,
      tokenAvailable: !!token,
      tokenLength: token.length,
      payload: {
        sub: payload.sub,
        aud: payload.aud,
        role: payload.role,
        // Don't include sensitive information
      }
    });
  } catch (error: any) {
    console.error('Error checking JWT:', error);
    return NextResponse.json({
      error: 'Failed to check JWT',
      message: error.message
    }, { status: 500 });
  }
}
