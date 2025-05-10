import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure the route is not cached

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const requestBody = await req.json();

    // Basic validation
    const { query } = requestBody;
    if (!query) {
      return NextResponse.json({ error: 'Missing required query parameter' }, { status: 400 });
    }

    console.log('[video-discovery route] Processing discovery request for query:', query);

    // Call the ADK service with an extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout (300,000 ms)

    try {
      const response = await fetch('http://localhost:8001/recommend-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      // Clear the timeout once we have a response
      clearTimeout(timeoutId);

      // Check the content type to detect HTML responses
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      // Handle non-200 responses or non-JSON responses
      if (!response.ok || !isJson) {
        let errorMessage = `ADK service returned status ${response.status}`;

        // Get the response text for debugging
        const responseText = await response.text();
        const isHtml = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html');

        if (isHtml) {
          console.error('[video-discovery route] ADK service returned HTML instead of JSON');
          errorMessage = 'The API service returned an HTML error page instead of JSON. This usually indicates an API key issue.';

          // Check for common error messages in the HTML
          if (responseText.includes('API key not valid')) {
            errorMessage += ' API key is invalid.';
          } else if (responseText.toLowerCase().includes('referer') && responseText.toLowerCase().includes('blocked')) {
            errorMessage += ' Requests from this referer are blocked. Check API key restrictions.';
          } else if (responseText.toLowerCase().includes('quota')) {
            errorMessage += ' API quota exceeded.';
          }

          console.error('[video-discovery route] HTML response preview:', responseText.substring(0, 500));
        } else if (isJson) {
          try {
            // If it's JSON but not a 200 response, try to parse the error
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            console.error('[video-discovery route] Error parsing error response:', e);
          }
        } else {
          console.error('[video-discovery route] Unknown response format:', responseText.substring(0, 500));
        }

        console.error('[video-discovery route] ADK service error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 502 });
      }

      try {
        // Parse the JSON response
        const data = await response.json();
        console.log('[video-discovery route] Successfully received recommendations');

        // Return the recommendations data
        return NextResponse.json(data);
      } catch (jsonError) {
        console.error('[video-discovery route] Error parsing JSON response:', jsonError);
        return NextResponse.json({
          error: 'Failed to parse response from ADK service. The service may be returning invalid JSON.',
          recommendations: []
        }, { status: 502 });
      }

    } catch (fetchError) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Check if it's an AbortError (timeout)
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.error('[video-discovery route] Request timeout exceeded 5 minutes (300 seconds)');

        // Create educational-focused mock data for timeout cases
        const mainTopic = query.split(' ')[0];
        const mockRecommendations = [
          {
            videoId: "dQw4w9WgXcQ",
            title: `Learn ${mainTopic} - Step-by-Step Tutorial`,
            channelName: "Educational Channel",
            thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            duration: "10:30",
            views: "1.2M",
            publishDate: "2 years ago",
            relevanceScore: 9.5,
            benefit: `Learn essential ${mainTopic} concepts through hands-on exercises and real-world examples`
          },
          {
            videoId: "9bZkp7q19f0",
            title: `${mainTopic} Masterclass for ${requestBody.knowledgeLevel || 'Beginners'}`,
            channelName: "Expert Academy",
            thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
            duration: "15:45",
            views: "3.4M",
            publishDate: "1 year ago",
            relevanceScore: 8.7,
            benefit: `Master advanced ${mainTopic} techniques with practical projects and in-depth explanations`
          }
        ];

        return NextResponse.json(
          {
            error: 'Request timed out. For better results, try a more specific query with clear educational goals like "Learn Python for data science" or "JavaScript fundamentals for web development".',
            recommendations: mockRecommendations,
            timeout: true,
            usingMockData: true
          },
          { status: 200 } // Return 200 instead of 504 to allow the client to use the mock data
        );
      }

      // Other fetch errors
      console.error('[video-discovery route] Fetch error:', fetchError);
      return NextResponse.json(
        { error: `Failed to communicate with discovery service: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`, recommendations: [] },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[video-discovery route] Unhandled error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, recommendations: [] },
      { status: 500 }
    );
  }
}