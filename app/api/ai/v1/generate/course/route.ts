import { NextResponse } from "next/server";
import { generateCourse } from "@/tools/courseGenerator";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";
import type { CourseGenerationRequest } from "@/types/ai";

// Set response timeout to 2 minutes since this is a long-running operation
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
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

    // Combine transcript with video details for better context
    const enrichedVideoDetails = {
      ...videoDetails,
      description: `${videoDetails.description}\n\nTranscript:\n${transcript.map(t => t.text).join(' ')}`
    };

    // Generate course with retry logic
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const course = await generateCourse({ 
          videoId, 
          videoDetails: enrichedVideoDetails
        });

        return NextResponse.json({ course });
      } catch (error) {
        retryCount++;
        if (retryCount > maxRetries) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
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

// Ensure proper caching headers
export const dynamic = 'force-dynamic';
export const runtime = 'edge';