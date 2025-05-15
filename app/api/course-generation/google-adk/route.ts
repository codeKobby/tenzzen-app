import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/debug-logger';

const logger = createLogger('CourseGeneration');

export async function POST(req: NextRequest) {
  // Store the request body at the top level so it's accessible in catch blocks
  let requestBody;

  try {
    requestBody = await req.json();

    // Validate input
    const { videoId, videoTitle, videoDescription, transcript, video_data } = requestBody;
    if (!videoId) {
      return NextResponse.json({ error: 'Missing required video ID' }, { status: 400 });
    }

    logger.log('[google-adk route] Starting course generation for video:', videoId);

    // For testing, if the ADK service is not running, return mock data
    const adkUrl = 'http://localhost:8001/generate-course';
    const adkHealthUrl = 'http://localhost:8001/health';

    // Set proper headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };

    // First, try a simple connection test to see if the ADK service is responsive
    try {
      logger.log('[google-adk route] Testing connection to ADK service at:', adkUrl);
      const testResponse = await fetch(adkHealthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // No timeout for health check
      });

      if (testResponse.ok) {
        const healthData = await testResponse.json();
        logger.log('[google-adk route] ADK service health check successful:', healthData);
      } else {
        logger.error('[google-adk route] ADK service health check failed with status:', testResponse.status);
        throw new Error(`Health check failed with status ${testResponse.status}`);
      }
    } catch (healthError) {
      logger.error('[google-adk route] ADK service health check failed:', healthError);
      // Continue anyway, we'll try the main request
    }

    // Now try the actual course generation request
    let response;
    try {
      logger.log('[google-adk route] Attempting to connect to ADK service at:', adkUrl);

      // First try with a test connection to verify basic connectivity
      const testConnectionResponse = await fetch(adkUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          video_id: 'test_connection',
          video_title: 'Connection Test',
          video_description: 'Testing connection to ADK service',
          transcript: 'This is a test transcript',
          video_data: {},
        }),
        // No timeout for test connection
      });

      if (testConnectionResponse.ok) {
        logger.log('[google-adk route] Test connection successful, proceeding with actual request');
      } else {
        logger.error('[google-adk route] Test connection failed with status:', testConnectionResponse.status);
      }

      // Now make the actual request - with no timeout
      // The ADK service can take a long time for large videos
      // We'll let the client handle timeouts instead
      response = await fetch(adkUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          video_id: videoId,
          video_title: videoTitle || '',
          video_description: videoDescription || '',
          transcript: transcript || '',
          video_data: video_data || {},
        }),
        // No timeout for the actual request - let it complete naturally
        // The client will handle timeouts for the initial connection
      });
      logger.log('[google-adk route] Connection to ADK service successful, status:', response.status);
    } catch (fetchError) {
      logger.error('[google-adk route] Failed to connect to ADK service:', fetchError);

      // Get error details
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown connection error';

      // Return error response instead of mock data to make the issue more visible
      return NextResponse.json({
        error: `Failed to connect to ADK service: ${errorMessage}. Please ensure the ADK service is running at http://localhost:8001 with 'cd adk_service; uvicorn server:app --reload'`
      }, { status: 503 });
    }

    // Read the response once
    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const isHtml = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html');

    // Handle non-200 responses
    if (!response.ok) {
      let errorMessage = `ADK service returned status ${response.status}`;

      // Try to get more detailed error information
      if (isJson) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          logger.error('[google-adk route] Error parsing error JSON response:', e);
        }
      } else if (isHtml) {
        errorMessage = `ADK service returned HTML instead of JSON (status ${response.status})`;

        // Extract more detailed error information from HTML if possible
        if (responseText.includes("API key not valid")) {
          errorMessage += ": API key is invalid";
        } else if (responseText.toLowerCase().includes("referer") && responseText.toLowerCase().includes("blocked")) {
          errorMessage += ": Requests from this referer are blocked. Check API key restrictions";
        } else if (responseText.toLowerCase().includes("quota")) {
          errorMessage += ": API quota exceeded";
        }
      }

      logger.error('[google-adk route] ADK service error:', errorMessage);
      logger.error('[google-adk route] Response content preview:', responseText.substring(0, 200));

      // Return error response with detailed message
      return NextResponse.json({
        error: `${errorMessage}. Please check the ADK service configuration and logs.`,
        videoId
      }, { status: 502 });
    }

    // Handle HTML responses even if status is 200
    if (isHtml) {
      logger.error('[google-adk route] Received HTML instead of JSON from ADK service');

      // Extract more detailed error information from HTML if possible
      let errorDetail = "Unknown HTML error";
      if (responseText.includes("API key not valid")) {
        errorDetail = "API key is invalid";
      } else if (responseText.toLowerCase().includes("referer") && responseText.toLowerCase().includes("blocked")) {
        errorDetail = "Requests from this referer are blocked. Check API key restrictions";
      } else if (responseText.toLowerCase().includes("quota")) {
        errorDetail = "API quota exceeded";
      }

      logger.error(`[google-adk route] HTML error details: ${errorDetail}`);

      // Return error response instead of mock data to make the issue more visible
      return NextResponse.json({
        error: `ADK service returned HTML instead of JSON: ${errorDetail}. Please check the ADK service configuration.`
      }, { status: 502 });
    }

    // Parse the JSON response
    try {
      // Parse the text as JSON
      const courseData = JSON.parse(responseText);
      logger.log('[google-adk route] Successfully received course data for video:', videoId);

      // Handle potential error field in the response
      if (courseData.error) {
        logger.error('[google-adk route] Error in course data:', courseData.error);
        return NextResponse.json({ error: courseData.error }, { status: 400 });
      }

      // Log the course data structure before returning
      logger.log('[google-adk route] Course data structure:', JSON.stringify({
        keys: Object.keys(courseData),
        hasNestedData: !!courseData.data,
        nestedDataKeys: courseData.data ? Object.keys(courseData.data) : []
      }, null, 2));

      // Add the transcript to the course data for saving to the database
      const courseDataWithTranscript = {
        ...courseData,
        transcript: requestBody.transcript || ''
      };

      // Return the course data with a completion flag
      return NextResponse.json({
        data: courseDataWithTranscript,
        status: "complete",
        progress: 100
      });

    } catch (jsonError) {
      logger.error('[google-adk route] Error parsing JSON response:', jsonError);
      logger.error('[google-adk route] Response content preview:', responseText.substring(0, 200));

      // Return error response instead of mock data to make the issue more visible
      const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error';
      return NextResponse.json({
        error: `Failed to parse response from ADK service: ${errorMessage}. Please check the ADK service logs.`
      }, { status: 502 });
    }
  } catch (error) {
    logger.error('[google-adk route] Unhandled error:', error);

    // Get error details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const videoId = requestBody?.videoId || '';
    const videoTitle = requestBody?.videoTitle || 'Unknown Video';

    // Return error response instead of mock data to make the issue more visible
    return NextResponse.json({
      error: `Course generation failed: ${errorMessage}. Please check the ADK service is running at http://localhost:8001 and properly configured.`,
      videoId,
      videoTitle
    }, { status: 500 });
  }
}

// Mock course data function removed as it's no longer used
