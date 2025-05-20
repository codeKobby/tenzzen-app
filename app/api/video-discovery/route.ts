import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure the route is not cached

// Get ADK service URL and timeout from environment variables or use defaults
const ADK_SERVICE_URL = process.env.NEXT_PUBLIC_ADK_SERVICE_URL || 'http://localhost:8001';
const ADK_SERVICE_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_ADK_SERVICE_TIMEOUT || '300000', 10); // Default to 5 minutes (300000ms)

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
    console.log('[video-discovery route] Using ADK service URL:', ADK_SERVICE_URL);

    // Call the ADK service with retry logic
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        // Use AbortController for timeout with the configured timeout value
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ADK_SERVICE_TIMEOUT); // Use configured timeout

        try {
          const response = await fetch(`${ADK_SERVICE_URL}/recommend-videos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId); // Clear the timeout if fetch completes

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

        // If we have retries left, try again
        if (retryCount < maxRetries) {
          console.log(`[video-discovery route] Retrying request (${retryCount + 1}/${maxRetries})...`);
          retryCount++;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }

        return NextResponse.json({
          error: errorMessage,
          retried: retryCount > 0,
          recommendations: []
        }, { status: 502 });
      }

      try {
        // Parse the JSON response
        const data = await response.json();
        console.log('[video-discovery route] Successfully received recommendations');

        // Return the recommendations data
        return NextResponse.json(data);
      } catch (jsonError) {
        console.error('[video-discovery route] Error parsing JSON response:', jsonError);

        // If we have retries left, try again
        if (retryCount < maxRetries) {
          console.log(`[video-discovery route] Retrying request after JSON parse error (${retryCount + 1}/${maxRetries})...`);
          retryCount++;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }

        return NextResponse.json({
          error: 'Failed to parse response from ADK service. The service may be returning invalid JSON.',
          retried: retryCount > 0,
          recommendations: []
        }, { status: 502 });
      }
      } catch (timeoutError) {
        // Clear the timeout
        clearTimeout(timeoutId);

        // Store the error for potential retry
        lastError = timeoutError instanceof Error ? timeoutError : new Error(String(timeoutError));
        console.error(`[video-discovery route] Timeout error (attempt ${retryCount + 1}/${maxRetries + 1}):`, lastError);

        // If we have retries left, try again
        if (retryCount < maxRetries) {
          console.log(`[video-discovery route] Retrying request after timeout (${retryCount + 1}/${maxRetries})...`);
          retryCount++;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }

        // If we've exhausted all retries, return an error
        return NextResponse.json(
          {
            error: `Connection to ADK service timed out after ${ADK_SERVICE_TIMEOUT/1000} seconds. The service might be running but not responding properly.`,
            retried: retryCount > 0,
            recommendations: [],
            serviceStatus: 'The ADK service may not be running or is overloaded. Please check if it is running with "cd adk_service; uvicorn server:app --reload --host 0.0.0.0"'
          },
          { status: 504 } // Gateway Timeout
        );
      }
    } catch (fetchError) {
      // Store the error for potential retry
      lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      console.error(`[video-discovery route] Fetch error (attempt ${retryCount + 1}/${maxRetries + 1}):`, lastError);

      // Check for specific error types
      let detailedMessage = lastError.message;
      let statusCode = 502; // Bad Gateway

      const errorString = lastError.toString().toLowerCase();

      // Check for header timeout errors
      if (errorString.includes('header') && errorString.includes('timeout')) {
        detailedMessage = `Headers timeout error when connecting to ADK service. The service might be running but not responding properly.`;
        statusCode = 504; // Gateway Timeout
      }
      // Check for network errors
      else if (errorString.includes('network') || errorString.includes('fetch failed')) {
        detailedMessage = `Network error when connecting to ADK service. Check if the service is running and accessible.`;
      }

      // If we have retries left, try again
      if (retryCount < maxRetries) {
        console.log(`[video-discovery route] Retrying request after fetch error (${retryCount + 1}/${maxRetries})...`);
        retryCount++;
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }

      // If we've exhausted all retries, return an error
      return NextResponse.json(
        {
          error: `Failed to communicate with discovery service: ${detailedMessage}`,
          retried: retryCount > 0,
          recommendations: [],
          serviceStatus: 'The ADK service may not be running. Please start it with "cd adk_service; uvicorn server:app --reload"'
        },
        { status: statusCode }
      );
    }
    } // End of while loop
  } catch (error) {
    console.error('[video-discovery route] Unhandled error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, recommendations: [] },
      { status: 500 }
    );
  }
}