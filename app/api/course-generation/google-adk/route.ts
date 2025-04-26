import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    // Validate input
    const { videoId, videoTitle, videoDescription, transcript, video_data } = requestBody;
    if (!videoId) {
      return NextResponse.json({ error: 'Missing required video ID' }, { status: 400 });
    }

    console.log('[google-adk route] Starting course generation for video:', videoId);

    // Call the ADK service (now configured for direct JSON response)
    const response = await fetch('http://localhost:8000/generate-course', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId,
        video_title: videoTitle || '',
        video_description: videoDescription || '',
        transcript: transcript || '',
        video_data: video_data || {},
      }),
    });

    // Handle non-200 responses
    if (!response.ok) {
      let errorMessage = `ADK service returned status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        console.error('[google-adk route] Error parsing error response:', e);
      }
      console.error('[google-adk route] ADK service error:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    // Parse the JSON response directly
    try {
      const courseData = await response.json();
      console.log('[google-adk route] Successfully received course data for video:', videoId);
      
      // Handle potential error field in the response
      if (courseData.error) {
        console.error('[google-adk route] Error in course data:', courseData.error);
        return NextResponse.json({ error: courseData.error }, { status: 400 });
      }
      
      // Return the course data as-is
      return NextResponse.json({ data: courseData });
      
    } catch (jsonError) {
      console.error('[google-adk route] Error parsing JSON response:', jsonError);
      return NextResponse.json(
        { error: `Failed to parse response from ADK service: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error'}` },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[google-adk route] Unhandled error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
