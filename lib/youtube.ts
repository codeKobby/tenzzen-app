import { createLogger } from './debug-logger';

// Create a logger instance
const logger = createLogger('YouTubeAPI');

/**
 * Fetches content details for a YouTube video
 */
export async function getYouTubeContentDetails(videoId: string) {
  try {
    logger.log(`Fetching content details for video: ${videoId}`);
    
    // Make sure we have a video ID
    if (!videoId || videoId === 'undefined') {
      logger.error('Missing or invalid video ID');
      return createFallbackVideoContent(videoId);
    }
    
    // API key may be missing in development - use fallback
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      logger.error('Missing YouTube API key - using fallback content');
      return createFallbackVideoContent(videoId);
    }
    
    // Set up the YouTube API request with proper headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`,
        { headers }
      );
      
      // Check if we got a successful response
      if (!response.ok) {
        const text = await response.text();
        logger.error(`YouTube API error: ${response.status} ${text}`);
        throw new Error(`YouTube API returned ${response.status}`);
      }
      
      // Try to parse JSON
      let responseText;
      try {
        responseText = await response.text();
        const data = JSON.parse(responseText);
        
        // Check if the API returned any items
        if (!data.items || data.items.length === 0) {
          logger.error('No items returned from YouTube API');
          return createFallbackVideoContent(videoId);
        }
        
        // Return the first item with video ID
        return {
          ...data.items[0],
          id: videoId
        };
      } catch (parseError) {
        logger.error('Failed to parse JSON response:', responseText);
        throw new Error('Invalid response format from YouTube API');
      }
    } catch (apiError) {
      logger.error('YouTube API request failed:', apiError);
      // Use fallback content
      return createFallbackVideoContent(videoId);
    }
  } catch (error) {
    logger.error('Error fetching YouTube content details:', error);
    // Return fallback content instead of throwing
    return createFallbackVideoContent(videoId);
  }
}

/**
 * Creates fallback video content when API access fails
 */
function createFallbackVideoContent(videoId: string) {
  logger.log(`Creating fallback content for video: ${videoId}`);
  
  return {
    id: videoId,
    snippet: {
      title: "YouTube Video",
      description: "Video content details unavailable. Using fallback data.",
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

// Parse YouTube duration format (PT1H2M10S) to seconds
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const [, hours, minutes, seconds] = match;
  return (
    (parseInt(hours || '0') * 3600) +
    (parseInt(minutes || '0') * 60) +
    parseInt(seconds || '0')
  );
}

// Format seconds to human-readable duration
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

// --- Added Missing Utilities ---

/**
 * Identifies if a YouTube ID belongs to a video or playlist.
 * This is a simplified check based on typical ID lengths and patterns.
 * A more robust check might involve API calls, but this is often sufficient.
 */
export async function identifyYoutubeIdType(id: string): Promise<'video' | 'playlist' | 'unknown'> {
  if (!id || typeof id !== 'string') return 'unknown';

  // Basic length checks (Video IDs are usually 11 chars, Playlist IDs are longer)
  if (id.length === 11 && !id.includes('&') && !id.includes('?')) {
    // Could potentially be a video ID, do a quick API check to be more certain
    // For simplicity here, we assume 11 chars = video
    return 'video';
  } else if (id.length > 11 && id.startsWith('PL')) {
    // Standard playlist IDs start with PL and are longer
    return 'playlist';
  } else if (id.length > 11) {
     // Could be a non-standard playlist ID or channel ID, assume playlist for now
     // A more robust check would involve trying playlist API endpoint
     logger.warn(`Assuming ID '${id}' is a playlist based on length > 11.`);
     return 'playlist';
  }

  logger.warn(`Could not determine type for ID: ${id}`);
  return 'unknown';
}

/**
 * Returns fetch options, potentially including headers for API restrictions.
 * Currently returns empty options, but can be expanded.
 */
export async function getFetchOptions(): Promise<RequestInit> {
  // Example: Add headers if needed for domain restriction or auth
  const headers: HeadersInit = {
    'Accept': 'application/json',
    // 'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', // Example
  };
  return {
    // headers: headers, // Uncomment and configure if needed
  };
}
