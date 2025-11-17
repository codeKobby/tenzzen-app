import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const { videoId, videoTitle, videoDescription, transcript } = body;
    if (!videoId || !videoTitle || !transcript) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call the ADK service
    const response = await fetch('http://localhost:8080/generate-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: videoId,
        video_title: videoTitle,
        video_description: videoDescription,
        transcript,
        video_data: {}, // Add additional video metadata if available
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const error = contentType?.includes('application/json')
        ? await response.json()
        : { message: `API error: ${response.status}` };
      return NextResponse.json({ error: error.message || 'Failed to generate course' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`API returned non-JSON: ${contentType}`);
    }
    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in /api/course-generation/google-ai:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
