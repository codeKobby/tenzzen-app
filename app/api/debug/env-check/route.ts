import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables
 * GET /api/debug/env-check
 */
export async function GET(req: NextRequest) {
  try {
    // Check if environment variables are defined
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    // Return the status of environment variables (without exposing actual values)
    return NextResponse.json({
      supabase: {
        url: {
          defined: !!supabaseUrl,
          length: supabaseUrl?.length || 0,
        },
        anonKey: {
          defined: !!supabaseAnonKey,
          length: supabaseAnonKey?.length || 0,
        },
      },
      clerk: {
        publishableKey: {
          defined: !!clerkPublishableKey,
          length: clerkPublishableKey?.length || 0,
        },
        secretKey: {
          defined: !!clerkSecretKey,
          length: clerkSecretKey?.length || 0,
        },
      },
      // Include Node environment
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    console.error('Error checking environment variables:', error);
    return NextResponse.json({ 
      error: 'Failed to check environment variables', 
      message: error.message 
    }, { status: 500 });
  }
}
