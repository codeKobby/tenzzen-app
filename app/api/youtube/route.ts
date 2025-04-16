import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/debug-logger';

const logger = createLogger('YouTubeAPI');

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing video ID' },
        { status: 400 }
      );
    }
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      logger.error('YouTube API key not configured');
      return NextResponse.json(createFallbackVideoContent(videoId));
    }
    
    // Set proper headers to avoid referrer issues
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };
    
    logger.log(`Fetching YouTube data for video ID: ${videoId}`);
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`,
        { headers }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`YouTube API error: ${response.status} ${errorText}`);
        return NextResponse.json(createFallbackVideoContent(videoId));
      }
      
      // Get the response as text first
      const responseText = await response.text();
      
      // Try to parse the JSON
      try {
        const data = JSON.parse(responseText);
        
        if (!data.items || data.items.length === 0) {
          logger.log('No video items returned from YouTube API');
          return NextResponse.json(createFallbackVideoContent(videoId));
        }
        
        // Return the processed data
        return NextResponse.json({
          ...data.items[0],
          id: videoId
        });
      } catch (parseError) {
        logger.error('Failed to parse YouTube API response:', responseText);
        return NextResponse.json(createFallbackVideoContent(videoId));
      }
    } catch (fetchError) {
      logger.error('Error fetching from YouTube API:', fetchError);
      return NextResponse.json(createFallbackVideoContent(videoId));
    }
  } catch (error) {
    logger.error('Error in YouTube API route:', error);
    return NextResponse.json(
      createFallbackVideoContent(error instanceof Error ? error.message : 'unknown')
    );
  }
}

/**
 * Creates a fallback video content structure when API access fails
 */
function createFallbackVideoContent(videoId: string) {
  return {
    id: videoId,
    snippet: {
      title: "YouTube Video",
      description: "Video content description not available. Using fallback data.",
      thumbnails: {
        default: {
          url: `https://img.youtube.com/vi/${videoId}/default.jpg`,
          width: 120,
          height: 90
        },
        medium: {
          url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          width: 320,
          height: 180
        },
        high: {
          url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          width: 480,
          height: 360
        }
      },
      publishedAt: new Date().toISOString()
    },
    contentDetails: {
      duration: "PT0M0S"
    }
  };
}
