import { NextRequest, NextResponse } from "next/server";

/**
 * Simple health check endpoint to verify that the API routes are working correctly
 * GET /api/health
 */
export async function GET(req: NextRequest) {
  try {
    // Check environment variables (Supabase/ADK removed)
    const envCheck = {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
    };

    // Return success response
    return new NextResponse(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        environmentVariables: envCheck,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Health check error:", error);

    // Return error response
    return new NextResponse(
      JSON.stringify({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
