import { NextRequest, NextResponse } from 'next/server';
import { generateCourseFromYoutubeVideo } from '@/lib/ai/course-ai-service';
import { logger } from '@/lib/ai/debug-logger';
import { auth } from '@clerk/nextjs/server'; // Fix: Use auth instead of currentUser

// Define a proper type for progress tracker that includes result and error
interface ProgressData {
  progress: number;
  message: string;
  startTime: number;
  result?: any;  // Make result optional
  error?: string; // Make error optional
}

// Define progress tracker for course generation
const progressTracker = new Map<string, ProgressData>();

export async function POST(req: NextRequest) {
  try {
    // Fix: Await the auth() call to get userId
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { videoUrl } = await req.json();
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Missing videoUrl parameter' },
        { status: 400 }
      );
    }
    
    // Create unique tracking ID for this generation
    const trackingId = `${userId}-${Date.now()}`;
    
    // Set initial progress state
    progressTracker.set(trackingId, {
      progress: 0,
      message: 'Initializing course generation',
      startTime: Date.now()
    });
    
    // Process the course generation asynchronously
    (async () => {
      try {
        // Generate the course with progress updates
        const course = await generateCourseFromYoutubeVideo({
          videoUrl,
          onProgress: (progress, message) => {
            const existing = progressTracker.get(trackingId);
            if (existing) {
              progressTracker.set(trackingId, {
                ...existing,
                progress,
                message: message || 'Processing'
              });
            }
          }
        });
        
        // Store result in tracking map with 100% progress
        const existing = progressTracker.get(trackingId);
        if (existing) {
          progressTracker.set(trackingId, {
            ...existing,
            progress: 100,
            message: 'Complete',
            result: course
          });
        }
        
        // Remove tracking data after 5 minutes
        setTimeout(() => {
          progressTracker.delete(trackingId);
        }, 5 * 60 * 1000);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Store error in tracking map
        const existing = progressTracker.get(trackingId);
        if (existing) {
          progressTracker.set(trackingId, {
            ...existing,
            progress: -1,
            message: `Error: ${errorMessage}`,
            error: errorMessage
          });
        }
        
        // Log the error
        logger.error('api', 'Course generation failed', { 
          error: errorMessage, 
          videoUrl,
          userId,
          trackingId
        });
      }
    })();
    
    // Return tracking ID immediately
    return NextResponse.json({ trackingId });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('api', 'Course generation request failed', { error: errorMessage });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Fix: Await the auth() call to get userId
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get tracking ID from query params
    const url = new URL(req.url);
    const trackingId = url.searchParams.get('trackingId');
    
    if (!trackingId) {
      return NextResponse.json(
        { error: 'Missing trackingId parameter' },
        { status: 400 }
      );
    }
    
    // Verify tracking ID belongs to current user
    if (!trackingId.startsWith(`${userId}-`)) {
      return NextResponse.json(
        { error: 'Invalid tracking ID' },
        { status: 403 }
      );
    }
    
    // Get progress data
    const progressData = progressTracker.get(trackingId);
    
    if (!progressData) {
      return NextResponse.json(
        { error: 'Tracking ID not found or expired' },
        { status: 404 }
      );
    }
    
    // Return progress status
    return NextResponse.json({
      progress: progressData.progress,
      message: progressData.message,
      elapsedMs: Date.now() - progressData.startTime,
      result: progressData.result, // Now typed correctly
      error: progressData.error    // Now typed correctly
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('api', 'Progress check failed', { error: errorMessage });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
