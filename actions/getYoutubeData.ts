'use server';

import { VideoDetails, PlaylistDetails } from "@/types/youtube";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { identifyYoutubeIdType, getFetchOptions } from "@/lib/utils/youtube-server";
import { formatViews, formatDuration } from "@/lib/utils/format";
import { createAILogger } from "@/lib/ai/debug-logger";

const logger = createAILogger("youtube-data");

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
        logger.debug(`Cache hit for videoId: ${videoId}`);
        // Return the minimal structure as before, assuming downstream code handles it
        // OR: Consider reconstructing the full VideoDetails if needed everywhere
        return {
          id: videoId,
          type: "video",
          title: cachedVideo.details.title, // Already checked this exists
          description: cachedVideo.details.description || '', // Add fallback
          thumbnail: cachedVideo.details.thumbnail || '', // Add fallback
          duration: formatDuration(cachedVideo.details.duration || ''), // Add fallback
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
          logger.debug(`Cache miss for videoId: ${videoId}. Fetching from API.`);
      }
    } catch (cacheError) {
      logger.warn(`Error retrieving from cache for videoId ${videoId}:`, cacheError);
    }

    // Fetch from YouTube API
    logger.debug(`Fetching details from YouTube API for videoId: ${videoId}`);
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

        logger.debug(`Attempting to cache videoId: ${videoId}`);
        await getConvexClient().mutation(api.videos.cacheVideo, cacheData);
        logger.debug(`Successfully cached videoId: ${videoId}`);
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
  }
}

export const getVideoDetails = getYoutubeData;
export async function getYoutubeData(id: string): Promise<VideoDetails | PlaylistDetails> {
  try {
    if (!id || id.trim() === '') {
      throw new Error('Invalid ID: Empty ID provided');
    }

    const idType = await identifyYoutubeIdType(id);
    
    if (idType === 'video') {
      return await getFullVideoDetails(id);
    } else if (idType === 'playlist') {
      return await getPlaylistById(id);
    } else {
      throw new Error('UNKNOWN_ID_TYPE');
    }

  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
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
