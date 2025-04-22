 'use server';

import { VideoDetails, PlaylistDetails } from "@/types/youtube";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { identifyYoutubeIdType, getFetchOptions } from "@/lib/utils/youtube-server";
import { formatViews, formatDuration } from "@/lib/utils/format";
import { createLogger } from "@/lib/debug-logger";

const logger = createLogger("youtube-data");

// Server-side implementation of safeGet function
function safeGet(obj: any, path: string, defaultValue: any = undefined) {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    return result !== undefined && result !== null ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

// Initialize Convex client
let convex: ConvexHttpClient;
const getConvexClient = () => {
  if (!convex) {
    convex = new ConvexHttpClient(config.convex.url);
  }
  return convex;
};

// Fetch channel details including avatar
async function getChannelAvatar(channelId: string): Promise<string> {
  try {
    const response = await fetch(
      `${config.youtube.apiUrl}/channels?part=snippet&id=${channelId}&key=${config.youtube.apiKey}`,
      await getFetchOptions()
    );

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    return safeGet(data, 'items.0.snippet.thumbnails.default.url', '');
  } catch (error) {
    logger.error('Failed to fetch channel avatar:', error);
    return '';
  }
}

async function getFullVideoDetails(videoId: string): Promise<VideoDetails> {
  try {
    // Check cache first
    try {
      const cachedVideo = await getConvexClient().query(api.videos.getCachedVideo, { youtubeId: videoId });
      // Add checks for valid cache data and title
      if (cachedVideo && !('expired' in cachedVideo) && cachedVideo.details && cachedVideo.details.title) {
        logger.log(`Cache hit for videoId: ${videoId}`); // Use log
        // Return the minimal structure as before, assuming downstream code handles it
        // OR: Consider reconstructing the full VideoDetails if needed everywhere
        return {
          id: videoId,
          type: "video",
          title: cachedVideo.details.title, // Already checked this exists
          description: cachedVideo.details.description || '', // Add fallback
          thumbnail: cachedVideo.details.thumbnail || '', // Add fallback
          // Parse the ISO duration string from cache before formatting
          duration: formatDuration(cachedVideo.details.duration || ''),
          // These fields are missing from cache, return empty/defaults
          channelId: '',
          channelName: '',
          channelAvatar: '',
          views: '0',
          likes: '0',
          publishDate: ''
        };
      } else if (cachedVideo) {
          logger.warn(`Invalid cache data for videoId: ${videoId}. Missing details or title. Refetching.`);
      } else {
          logger.log(`Cache miss for videoId: ${videoId}. Fetching from API.`); // Use log
      }
    } catch (cacheError) {
      logger.warn(`Error retrieving from cache for videoId ${videoId}:`, cacheError);
    }

    // Fetch from YouTube API
    logger.log(`Fetching details from YouTube API for videoId: ${videoId}`); // Use log
    const apiResponse = await fetch(
      `${config.youtube.apiUrl}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${config.youtube.apiKey}`,
      await getFetchOptions()
    );

    if (!apiResponse.ok) {
      throw new Error(`YouTube API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    if (!data.items?.[0]) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const channelId = safeGet(video, 'snippet.channelId', '');
    const channelAvatar = await getChannelAvatar(channelId);

    const videoDetails: VideoDetails = {
      id: videoId,
      type: "video",
      title: safeGet(video, 'snippet.title', 'Unknown title'),
      description: safeGet(video, 'snippet.description', ''),
      thumbnail: safeGet(video, 'snippet.thumbnails.maxres.url') ||
                safeGet(video, 'snippet.thumbnails.high.url') ||
                safeGet(video, 'snippet.thumbnails.standard.url') ||
                '',
      // Parse the ISO duration string from API before formatting
      duration: formatDuration(video.contentDetails?.duration || ""),
      channelId: channelId,
      channelName: safeGet(video, 'snippet.channelTitle', ''),
      channelAvatar: channelAvatar,
      views: formatViews(safeGet(video, 'statistics.viewCount', '0')),
      likes: formatViews(safeGet(video, 'statistics.likeCount', '0')),
      publishDate: video.snippet?.publishedAt ? 
        new Date(video.snippet.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : ''
    };

    // Cache the video data only if the title is valid
    if (videoDetails.title && videoDetails.title !== 'Unknown title') {
      try {
        const cacheData = {
          youtubeId: videoId,
        cachedAt: new Date().toISOString(),
          details: {
            // Ensure all fields expected by the cache schema are present
            id: videoId,
            type: "video",
            title: videoDetails.title, // We know this is valid here
            description: videoDetails.description,
            thumbnail: videoDetails.thumbnail,
            duration: video.contentDetails?.duration || ""
            // Add other fields if the cache schema requires them
          }
        };

        logger.log(`Attempting to cache videoId: ${videoId}`); // Use log
        await getConvexClient().mutation(api.videos.cacheVideo, cacheData);
        logger.log(`Successfully cached videoId: ${videoId}`); // Use log
      } catch (cacheError) {
        // Log specific Convex validation errors if possible
        logger.warn(`Failed to cache videoId ${videoId}:`, cacheError);
      }
    } else {
        logger.warn(`Skipping cache for videoId ${videoId} due to missing or invalid title.`);
    }

    return videoDetails;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Exporting getYoutubeData directly is fine, no need for the alias if unused elsewhere
// export const getVideoDetails = getYoutubeData;

export async function getYoutubeData(id: string): Promise<VideoDetails | PlaylistDetails> {
  logger.log(`getYoutubeData called for ID: ${id}`); // Add logging
  try {
    if (!id || id.trim() === '') {
      logger.warn('Invalid ID received: Empty ID provided');
      throw new Error('Invalid ID: Empty ID provided');
    }

    const idType = await identifyYoutubeIdType(id);
    logger.log(`Identified ID type: ${idType} for ID: ${id}`);

    if (idType === 'video') {
      return await getFullVideoDetails(id);
    } else if (idType === 'playlist') {
      // Assuming getPlaylistById is implemented correctly
      logger.log(`Fetching playlist details for ID: ${id}`);
      return await getPlaylistById(id);
    } else {
      logger.warn(`Unknown ID type for ID: ${id}`);
      throw new Error(`Could not determine type for ID: ${id}`); // More specific error
    }

  } catch (error) {
     // Log the specific error before re-throwing a potentially generic one
     logger.error(`Error in getYoutubeData for ID ${id}:`, error);

     // Re-throw a clear error message
     if (error instanceof Error) {
       // Add context to known errors
       if (error.message.includes('UNKNOWN_ID_TYPE') || error.message.includes('Could not determine type')) {
         throw new Error(`Could not determine if '${id}' is a valid YouTube Video or Playlist ID.`);
       }
       if (error.message.includes('Video not found')) {
         throw new Error(`YouTube video with ID '${id}' could not be found.`);
       }
       if (error.message.includes('Playlist not found')) {
         throw new Error(`YouTube playlist with ID '${id}' could not be found.`);
       }
       if (error.message.includes('YouTube API error')) {
         // Avoid leaking raw status codes directly if sensitive
         throw new Error(`Failed to communicate with YouTube API. Please check API key/quotas.`);
       }
       // Keep original message for other errors but add context
       throw new Error(`Failed to get YouTube data: ${error.message}`);
     } else {
       // Handle non-Error objects being thrown
       throw new Error(`An unexpected error occurred while fetching YouTube data.`);
     }
  }
}


async function getPlaylistById(playlistId: string): Promise<PlaylistDetails> {
  try {
    // Fetch playlist details from YouTube API
    const playlistResponse = await fetch(
      `${config.youtube.apiUrl}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${config.youtube.apiKey}`,
      await getFetchOptions()
    );

    if (!playlistResponse.ok) {
      throw new Error(`YouTube API error: ${playlistResponse.status}`);
    }

    const playlistData = await playlistResponse.json();
    if (!playlistData.items?.[0]) {
      throw new Error('Playlist not found');
    }

    const playlist = playlistData.items[0];
    const channelId = safeGet(playlist, 'snippet.channelId', '');
    const channelAvatar = await getChannelAvatar(channelId);
    
    // Get first few videos from the playlist
    const playlistItemsResponse = await fetch(
      `${config.youtube.apiUrl}/playlistItems?part=snippet,contentDetails&maxResults=10&playlistId=${playlistId}&key=${config.youtube.apiKey}`,
      await getFetchOptions()
    );

    if (!playlistItemsResponse.ok) {
      throw new Error(`YouTube API error: ${playlistItemsResponse.status}`);
    }

    const playlistItemsData = await playlistItemsResponse.json();
    const playlistItems = playlistItemsData.items || [];

    // Fetch full details for each video
    const videoPromises = playlistItems.map(async (item: any) => {
      const videoId = safeGet(item, 'contentDetails.videoId', '');
      const position = safeGet(item, 'snippet.position', 0);
      
      try {
        const videoDetails = await getFullVideoDetails(videoId);
        return {
          ...videoDetails,
          position
        };
      } catch (error) {
        // Fallback to basic details if full fetch fails
        return {
          id: videoId,
          type: "video" as const,
          position,
          title: safeGet(item, 'snippet.title', 'Unknown video'),
          description: safeGet(item, 'snippet.description', ''),
          thumbnail: safeGet(item, 'snippet.thumbnails.high.url') || 
                    safeGet(item, 'snippet.thumbnails.medium.url') || 
                    safeGet(item, 'snippet.thumbnails.default.url') || '',
          duration: '00:00',
          channelId: channelId,
          channelName: safeGet(item, 'snippet.channelTitle', ''),
          channelAvatar: channelAvatar,
          views: '0',
          likes: '0',
          publishDate: safeGet(item, 'snippet.publishedAt', '')
        };
      }
    });
    
    const videos = await Promise.all(videoPromises);
    
    const playlistDetails: PlaylistDetails = {
      id: playlistId,
      type: "playlist",
      title: safeGet(playlist, 'snippet.title', 'Unknown playlist'),
      description: safeGet(playlist, 'snippet.description', ''),
      thumbnail: safeGet(playlist, 'snippet.thumbnails.maxres.url') ||
                safeGet(playlist, 'snippet.thumbnails.high.url') ||
                safeGet(playlist, 'snippet.thumbnails.standard.url') ||
                '',
      channelId: channelId,
      channelName: safeGet(playlist, 'snippet.channelTitle', ''),
      channelAvatar: channelAvatar,
      itemCount: safeGet(playlist, 'contentDetails.itemCount', 0),
      videos: videos
    };

    return playlistDetails;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}
