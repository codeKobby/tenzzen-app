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

    // Call the ADK service without a timeout
    try {
      const response = await fetch('http://localhost:8001/recommend-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

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
      // Handle fetch errors without timeout logic

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