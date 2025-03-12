import { NextResponse } from "next/server";
import { generateCourse } from "@/tools/courseGenerator";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";
import { withRateLimit } from "@/lib/ai/openai";
import type { CourseGenerationRequest } from "@/types/ai";

// Set response timeout to 3 minutes since we're processing chunks
export const maxDuration = 180;

// Ensure proper caching headers
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Check if request was cancelled
    const signal = req.signal;
    if (signal.aborted) {
      return NextResponse.json(
        { error: "Request cancelled" },
        { status: 499 }
      );
    }

    // Parse request body
    const data = await req.json();
    const { videoId, videoDetails } = data as CourseGenerationRequest;
    
    // Get transcript
    const transcript = await getYoutubeTranscript(videoId);
    if (!transcript) {
      return NextResponse.json(
        { error: "Failed to fetch video transcript" },
        { status: 400 }
      );
    }

    // Extract transcript text
    const transcriptText = transcript.map(t => t.text);

    // Generate course with chunked processing and rate limit handling
    try {
      const course = await generateCourse({ 
        videoId, 
        videoDetails,
        transcript: transcriptText
      });

      return NextResponse.json({ course });
    } catch (error) {
      if (error instanceof Error) {
        // Handle rate limit errors with proper status and retry guidance
        if (error.message.includes("Rate limit")) {
          return NextResponse.json(
            { error: "Rate limit reached. Please try again in a moment." },
            { 
              status: 429,
              headers: {
                'Retry-After': '60' // Suggest retry after 1 minute
              }
            }
          );
        }

        // Handle cancellation
        if (error.name === 'AbortError' || signal.aborted) {
          return NextResponse.json(
            { error: "Request cancelled" },
            { status: 499 }
          );
        }

        // Handle token limit errors
        if (error.message.includes("token")) {
          return NextResponse.json(
            { error: "Content is too long. Please try with a shorter video." },
            { status: 413 }
          );
        }

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      throw error; // Re-throw unknown errors
    }

  } catch (error) {
    console.error("Course generation error:", error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.name === 'AbortError' ? 499 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate course" },
      { status: 500 }
    );
  }
}