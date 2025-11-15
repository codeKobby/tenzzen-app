import { NextRequest, NextResponse } from 'next/server';

/**
 * Image proxy API route to handle YouTube thumbnail timeouts
 * 
 * This route fetches images from external sources with a longer timeout
 * and returns them to the client, acting as a middleware to prevent
 * timeout errors when loading YouTube thumbnails.
 */
export async function GET(request: NextRequest) {
  // Get the URL from the query parameters
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  // Validate the URL parameter
  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing "url" parameter' },
      { status: 400 }
    );
  }

  try {
    // Only allow specific domains for security
    const url = new URL(imageUrl);
    const allowedDomains = [
      'i.ytimg.com',
      'img.youtube.com',
      'yt3.ggpht.com',
      'yt3.googleusercontent.com',
      'ytimg.googleusercontent.com'
    ];

    if (!allowedDomains.includes(url.hostname)) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }

    // Fetch the image with a longer timeout (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get the image data
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // If it's an AbortError, it's a timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '"url" parameter is valid but request timed out' },
        { status: 504 }
      );
    }

    // For other errors
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

// Increase the default body size limit for this route
export const config = {
  api: {
    responseLimit: '8mb',
  },
};
