<<<<<<< HEAD
'use server';

import { VideoDetails, PlaylistDetails } from "@/types/youtube";
import { config } from "@/lib/config";
import { identifyYoutubeIdType, getFetchOptions } from "@/lib/utils/youtube-server";
import { formatViews, formatDuration, parseDurationToSeconds } from "@/lib/utils/format";
import { createLogger } from "@/lib/debug-logger";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

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

// Initialize Supabase client for caching videos
const getSupabaseClient = () => {
  return createAdminSupabaseClient();
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
      const supabase = getSupabaseClient();
      const { data: cachedVideo, error } = await supabase
        .from('videos')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (error) {
        logger.warn(`Error retrieving from cache for videoId ${videoId}:`, error);
      } else if (cachedVideo && cachedVideo.title) {
        logger.log(`Cache hit for videoId: ${videoId}`);

        // Check if video has transcript
        const hasTranscripts = !!cachedVideo.transcript;
        if (hasTranscripts) {
          logger.log(`Video has transcript`);
        }

        // Return the full structure from cache
        return {
          id: videoId,
          type: "video",
          title: cachedVideo.title,
          description: cachedVideo.description || '',
          thumbnail: cachedVideo.thumbnail || '',
          duration: formatDuration(cachedVideo.duration_raw || ''),
          channelId: cachedVideo.channel_id || '',
          channelName: cachedVideo.channel_title || '',
          channelAvatar: cachedVideo.channel_avatar || '',
          views: cachedVideo.view_count?.toString() || '0',
          likes: cachedVideo.like_count?.toString() || '0',
          publishDate: cachedVideo.published_at ? new Date(cachedVideo.published_at).toLocaleDateString() : '',
          hasTranscripts: hasTranscripts
        };
      } else {
        logger.log(`Cache miss for videoId: ${videoId}. Fetching from API.`);
      }
    } catch (cacheError) {
      logger.warn(`Error retrieving from cache for videoId ${videoId}:`, cacheError);
    }

    // Fetch from YouTube API
    logger.log(`Fetching details from YouTube API for videoId: ${videoId}`);
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
    const formattedViews = formatViews(safeGet(video, 'statistics.viewCount', '0'));
    const formattedLikes = formatViews(safeGet(video, 'statistics.likeCount', '0'));
    const formattedPublishDate = video.snippet?.publishedAt ?
=======
'use server'

import type { VideoDetails, PlaylistDetails, VideoItem } from '@/types/youtube'

// Internal interface for raw playlist video data before converting to VideoItem
interface RawPlaylistVideo {
  videoId: string
  position: number
  title?: string
  description?: string
  thumbnail?: string
  channelId?: string
  channelName?: string
  publishDate?: string
  duration?: string
}
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { config } from '@/lib/config'

// Create Convex client for server-side operations
// Initialize lazily to ensure it's only created on the server
let convex: ConvexHttpClient;
const getConvexClient = () => {
  if (!convex) {
    convex = new ConvexHttpClient(config.convex.url);
  }
  return convex;
}

// Server-side only fetch options
const fetchOptions = {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Tenzzen/1.0',
    'Origin': 'http://localhost:3000',
    'Referer': 'http://localhost:3000/'
  },
  cache: 'no-store' as const
}

// Helper function to parse ISO 8601 duration
const formatDuration = (duration: string): string => {
  if (!duration) return "0:00"

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)

  if (!match) return "0:00"

  const hours = match[1] ? parseInt(match[1]) : 0
  const minutes = match[2] ? parseInt(match[2]) : 0
  const seconds = match[3] ? parseInt(match[3]) : 0

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const formatViews = (viewCount: string | undefined): string => {
  if (!viewCount) return "0"
  const views = parseInt(viewCount)
  if (isNaN(views)) return "0"
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return viewCount
}

/**
 * Safely gets a property from a nested object without throwing errors
 */
const safeGet = (obj: any, path: string, defaultValue: any = undefined) => {
  try {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }

    return current === undefined ? defaultValue : current;
  } catch (e) {
    return defaultValue;
  }
};

// Helper to identify what type of content ID we're dealing with
function identifyYoutubeIdType(id: string): 'video' | 'playlist' | 'unknown' {
  // Video IDs are typically 11 characters
  if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return 'video';
  }

  // Playlist IDs often start with PL, FL, UU, etc.
  if (/^(PL|FL|UU|LL|RD|OL|TL|UL|OLAK5uy_)[A-Za-z0-9_-]{10,}$/.test(id)) {
    return 'playlist';
  }

  // If it's longer than 11 chars but doesn't match playlist patterns, guess playlist
  if (id.length > 11) {
    return 'playlist';
  }

  return 'unknown';
}

// Define interfaces for YouTube API responses based on the official documentation
interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

interface YouTubeResourceId {
  kind: string;
  videoId: string;
}

interface YouTubePlaylistItemSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  videoOwnerChannelTitle?: string;
  videoOwnerChannelId?: string;
  playlistId: string;
  position: number;
  resourceId: YouTubeResourceId;
}

interface YouTubePlaylistItemContentDetails {
  videoId: string;
  startAt?: string;
  endAt?: string;
  note?: string;
  videoPublishedAt?: string;
}

interface YouTubePlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubePlaylistItemSnippet;
  contentDetails?: YouTubePlaylistItemContentDetails;
  status?: {
    privacyStatus: string;
  };
}

interface YouTubePlaylistItemsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  items?: YouTubePlaylistItem[];
  error?: YouTubeError;
}

// Add error type for YouTube API responses
interface YouTubeErrorDetail {
  domain: string;
  reason: string;
  message: string;
  location?: string;
  locationType?: string;
}

interface YouTubeError {
  errors: YouTubeErrorDetail[];
  code: number;
  message: string;
}

export async function getVideoDetails(videoId: string) {
  'use server'
  try {
    // Basic validation
    if (!videoId || videoId.trim() === '') {
      throw new Error('Invalid video ID: Empty ID provided');
    }

    const idType = identifyYoutubeIdType(videoId);

    // If this doesn't look like a video ID, try redirecting
    if (idType !== 'video') {
      console.warn(`ID ${videoId} doesn't appear to be a valid video ID, might be a playlist`);
      // If this is clearly a playlist ID, reroute
      if (idType === 'playlist') {
        throw new Error('PLAYLIST_ID_PROVIDED');
      }
    }

    // Check cache first
    try {
      const cachedVideo = await getConvexClient().query(api.videos.getCachedVideo, { youtubeId: videoId })
      if (cachedVideo) {
        const { youtubeId, cachedAt, _id, _creationTime, ...videoData } = cachedVideo
        return {
          id: videoId,
          type: "video",
          ...videoData
        }
      }
    } catch (cacheError) {
      console.warn('Failed to retrieve from cache:', cacheError)
    }

    // Fetch from YouTube Data API
    const response = await fetch(
      `${config.youtube.apiUrl}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${config.youtube.apiKey}`,
      fetchOptions
    )

    if (!response.ok) {
      const responseText = await response.text()
      const errorDetails = {
        status: response.status,
        url: `${config.youtube.apiUrl}/videos?part=snippet,contentDetails,statistics&id=${videoId}`,
        response: responseText
      }
      console.error('YouTube API error:', errorDetails)

      // Handle various HTTP status codes
      switch (response.status) {
        case 403:
          throw new Error('Access to this content is restricted in your region.')
        case 404:
          throw new Error('Video not found or has been removed.')
        case 429:
          throw new Error('YouTube API quota exceeded. Please try again later.')
        default:
          // Try to parse error response
          try {
            const errorJson = JSON.parse(responseText)
            if (errorJson.error?.message) {
              throw new Error(errorJson.error.message)
            }
          } catch (e) {
            // Default error message if we can't parse the response
            throw new Error(`YouTube API error: ${response.status}`)
          }
      }
    }

    const data = await response.json()

    // Log response for debugging
    console.log('YouTube API response received:', JSON.stringify(data, null, 2).substring(0, 500) + '...');

    // Handle YouTube API errors
    if (data.error) {
      const error = data.error
      console.error('YouTube API Error Response:', error);
      if (error.errors?.[0]) {
        const detail = error.errors[0]
        if (detail.reason === 'quotaExceeded') {
          throw new Error('YouTube API quota exceeded. Please try again later.')
        }
        if (detail.reason === 'videoNotFound') {
          throw new Error('Video not found or has been removed.')
        }
        if (detail.reason === 'forbidden') {
          console.error('API Error Details:', detail);
          throw new Error('Access denied. Please check API key configuration.')
        }
        throw new Error(detail.message || 'YouTube API error')
      }
      throw new Error(error.message || 'YouTube API error')
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found')
    }

    const video = data.items[0]

    if (!video || !video.snippet) {
      throw new Error('Invalid video data returned from YouTube API')
    }

    // Get highest quality thumbnail available
    const thumbnail =
      safeGet(video, 'snippet.thumbnails.maxres.url') ||
      safeGet(video, 'snippet.thumbnails.high.url') ||
      safeGet(video, 'snippet.thumbnails.standard.url') ||
      safeGet(video, 'snippet.thumbnails.medium.url') ||
      safeGet(video, 'snippet.thumbnails.default.url') ||
      '';

    // Safely extract duration
    const duration = formatDuration(video.contentDetails?.duration || "0:00");

    // Extract other video data
    const channelId = safeGet(video, 'snippet.channelId', '');
    const channelTitle = safeGet(video, 'snippet.channelTitle', '');

    // Prepare the video data with safe extractions
    const videoData = {
      youtubeId: videoId,
      title: safeGet(video, 'snippet.title', 'Unknown title'),
      description: safeGet(video, 'snippet.description', ''),
      thumbnail: thumbnail,
      duration: duration,
      channelId: channelId,
      channelName: channelTitle,
      channelAvatar: '', // Will be populated below if channel request succeeds
      views: formatViews(safeGet(video, 'statistics.viewCount', '0')),
      likes: formatViews(safeGet(video, 'statistics.likeCount', '0')),
      publishDate: safeGet(video, 'snippet.publishedAt', '') ?
>>>>>>> master
        new Date(video.snippet.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
<<<<<<< HEAD
        }) : '';

    const videoDetails: VideoDetails = {
      id: videoId,
      type: "video",
      title: safeGet(video, 'snippet.title', 'Unknown title'),
      description: safeGet(video, 'snippet.description', ''),
      thumbnail: safeGet(video, 'snippet.thumbnails.maxres.url') ||
                safeGet(video, 'snippet.thumbnails.high.url') ||
                safeGet(video, 'snippet.thumbnails.standard.url') ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      // Parse the ISO duration string from API before formatting
      duration: formatDuration(video.contentDetails?.duration || ""),
      channelId: channelId,
      channelName: safeGet(video, 'snippet.channelTitle', ''),
      channelAvatar: channelAvatar,
      views: formattedViews, // Use formatted value
      likes: formattedLikes, // Use formatted value
      publishDate: formattedPublishDate, // Use formatted value
      // Default hasTranscripts to false as we're fetching fresh from API
      hasTranscripts: false
    };

    // Cache the video data only if the title is valid
    if (videoDetails.title && videoDetails.title !== 'Unknown title') {
      try {

        logger.log(`Attempting to cache videoId: ${videoId}`);

        // Use Supabase directly to cache the video
        const supabase = getSupabaseClient();

        // Check if a video with this ID already exists
        const { data: existingVideos, error: queryError } = await supabase
          .from('videos')
          .select('id')
          .eq('video_id', videoId)
          .limit(1);

        if (queryError) {
          logger.warn(`Error checking for existing video: ${queryError.message}`);
          throw queryError;
        }

        // Prepare video data for insertion/update
        const rawDuration = video.contentDetails?.duration || '';
        const durationInSeconds = parseDurationToSeconds(rawDuration);

        // Extract tags from the video
        const tags = safeGet(video, 'snippet.tags', []);

        // Extract comment count
        const commentCount = parseInt(safeGet(video, 'statistics.commentCount', '0'), 10) || 0;

        // Extract category ID
        const categoryId = safeGet(video, 'snippet.categoryId', '');

        const videoRecord = {
          video_id: videoId,
          title: videoDetails.title,
          description: videoDetails.description || '',
          thumbnail: videoDetails.thumbnail || '',
          duration: durationInSeconds, // Store duration in seconds
          duration_raw: rawDuration, // Store the raw ISO 8601 duration string
          channel_id: videoDetails.channelId || '',
          channel_title: videoDetails.channelName || '',
          channel_avatar: channelAvatar, // Store the channel avatar URL
          published_at: video.snippet?.publishedAt || null, // Store the raw ISO date
          view_count: parseInt(safeGet(video, 'statistics.viewCount', '0'), 10) || 0, // Store raw count
          like_count: parseInt(safeGet(video, 'statistics.likeCount', '0'), 10) || 0, // Store raw count
          comment_count: commentCount,
          category_id: categoryId,
          tags: tags,
          cached_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (existingVideos && existingVideos.length > 0) {
          // Update existing video
          const { error: updateError } = await supabase
            .from('videos')
            .update(videoRecord)
            .eq('id', existingVideos[0].id);

          if (updateError) {
            logger.warn(`Error updating video: ${updateError.message}`);
            throw updateError;
          }
        } else {
          // Insert new video
          const { error: insertError } = await supabase
            .from('videos')
            .insert(videoRecord);

          if (insertError) {
            logger.warn(`Error inserting video: ${insertError.message}`);
            throw insertError;
          }
        }

        logger.log(`Successfully cached videoId: ${videoId}`);
      } catch (cacheError) {
        // Log caching errors
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
                    safeGet(item, 'snippet.thumbnails.default.url') ||
                    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: '00:00',
          channelId: channelId,
          channelName: safeGet(item, 'snippet.channelTitle', ''),
          channelAvatar: channelAvatar,
          views: '0',
          likes: '0',
          publishDate: safeGet(item, 'snippet.publishedAt', ''),
          hasTranscripts: false
        };
      }
    });

    const videos = await Promise.all(videoPromises);

    const playlistDetails: PlaylistDetails = {
=======
        }) : 'Unknown date'
    }

    // Fetch channel details for avatar - but don't fail if this doesn't work
    try {
      if (channelId) {
        const channelResponse = await fetch(
          `${config.youtube.apiUrl}/channels?part=snippet&id=${channelId}&key=${config.youtube.apiKey}`,
          fetchOptions
        )

        if (channelResponse.ok) {
          const channelData = await channelResponse.json()
          const channel = channelData.items?.[0]
          if (channel?.snippet?.thumbnails?.default?.url) {
            videoData.channelAvatar = channel.snippet.thumbnails.default.url
          }
        } else {
          console.warn('Failed to fetch channel avatar, continuing without it')
        }
      }
    } catch (channelError) {
      // Don't fail the whole request if channel fetch fails
      console.warn('Error fetching channel details:', channelError)
    }

    // Cache the video data
    try {
      await getConvexClient().mutation(api.videos.cacheVideo, videoData)
    } catch (cacheError) {
      // Continue even if caching fails
      console.error('Failed to cache video data:', cacheError)
    }

    return {
      id: videoId,
      type: "video",
      ...videoData
    }
  } catch (error) {
    console.error('Error fetching YouTube video data:', error);

    // Special handling for when a playlist ID is detected
    if (error instanceof Error && error.message === 'PLAYLIST_ID_PROVIDED') {
      throw new Error(`This appears to be a playlist ID (${videoId}), not a video ID.`);
    }

    // Check for specific API errors
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('YouTube API quota exceeded. Please try again later.');
      }
      if (error.message.includes('403')) {
        throw new Error('Access to this video is restricted in your region.');
      }
      if (error.message.includes('404') || error.message.includes('Video not found')) {
        throw new Error(`Video not found: "${videoId}" may be invalid or has been removed.`);
      }

      // Return the actual error message for debugging
      throw new Error(`Failed to fetch video data: ${error.message}`);
    }

    throw new Error(`Failed to fetch video data for ID: ${videoId}`);
  }
}

export async function getPlaylistDetails(playlistId: string, fetchVideoDetails = true): Promise<PlaylistDetails> {
  'use server'
  try {
    // Basic validation
    if (!playlistId?.trim()) {
      throw new Error('Playlist ID is required');
    }

    console.log(`Attempting to fetch playlist with ID: ${playlistId}`);

    // Try to get from cache first (but we won't rely on this for videos data)
    let cachedPlaylistData = null;
    try {
      const cachedPlaylist = await getConvexClient().query(api.videos.getCachedPlaylist, { youtubeId: playlistId })
      if (cachedPlaylist) {
        cachedPlaylistData = cachedPlaylist;
      }
    } catch (cacheError) {
      console.warn('Failed to retrieve from cache:', cacheError)
    }

    // Fetch playlist details from YouTube API
    const response = await fetch(
      `${config.youtube.apiUrl}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${config.youtube.apiKey}`,
      fetchOptions
    )

    if (!response.ok) {
      const responseText = await response.text()
      const errorDetails = {
        status: response.status,
        url: `${config.youtube.apiUrl}/playlists?part=snippet,contentDetails&id=${playlistId}`,
        response: responseText
      }
      console.error('YouTube API error:', errorDetails)
      
      // Handle various HTTP status codes
      switch (response.status) {
        case 403:
          throw new Error('Access to this content is restricted in your region.')
        case 404:
          throw new Error('Playlist not found or has been removed.')
        case 429:
          throw new Error('YouTube API quota exceeded. Please try again later.')
        default:
          // Try to parse error response
          try {
            const errorJson = JSON.parse(responseText)
            if (errorJson.error?.message) {
              throw new Error(errorJson.error.message)
            }
          } catch (e) {
            // Default error message if we can't parse the response
            throw new Error(`YouTube API error: ${response.status}`)
          }
      }
    }

    const data = await response.json()

    // Handle YouTube API errors
    if (data.error) {
      // ...existing error handling code...
      throw new Error(data.error.message || 'YouTube API error')
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Playlist not found')
    }

    const playlist = data.items[0]

    if (!playlist || !playlist.snippet) {
      throw new Error('Invalid playlist data returned from YouTube API')
    }

    // Get highest quality thumbnail available
    const thumbnail =
      safeGet(playlist, 'snippet.thumbnails.maxres.url') ||
      safeGet(playlist, 'snippet.thumbnails.high.url') ||
      safeGet(playlist, 'snippet.thumbnails.standard.url') ||
      safeGet(playlist, 'snippet.thumbnails.medium.url') ||
      safeGet(playlist, 'snippet.thumbnails.default.url') ||
      '';

    const channelId = safeGet(playlist, 'snippet.channelId', '');
    const channelTitle = safeGet(playlist, 'snippet.channelTitle', '');

    let channelAvatar = '';

    // Fetch channel details for avatar - but don't fail if this doesn't work
    try {
      if (channelId) {
        // ...existing channel avatar fetching code...
      }
    } catch (channelError) {
      console.warn('Error fetching channel details for playlist:', channelError)
    }

    const publishDate = playlist.snippet.publishedAt ?
      new Date(playlist.snippet.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Unknown date';

    // Initialize playlist details with correct typing
    const videoCountValue = safeGet(playlist, 'contentDetails.itemCount', '0');
    const playlistData: PlaylistDetails = {
>>>>>>> master
      id: playlistId,
      type: "playlist",
      title: safeGet(playlist, 'snippet.title', 'Unknown playlist'),
      description: safeGet(playlist, 'snippet.description', ''),
<<<<<<< HEAD
      thumbnail: safeGet(playlist, 'snippet.thumbnails.maxres.url') ||
                safeGet(playlist, 'snippet.thumbnails.high.url') ||
                safeGet(playlist, 'snippet.thumbnails.standard.url') ||
                (videos[0]?.thumbnail || `https://i.ytimg.com/vi/${videos[0]?.id || playlistId}/hqdefault.jpg`),
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
=======
      thumbnail,
      channelId,
      channelName: channelTitle,
      channelAvatar,
      publishDate,
      videoCount: String(videoCountValue), // Ensure it's a string
      videos: [] // We'll populate this with actual videos
    };

    // Get playlist items using pagination
    const videos: VideoItem[] = [];
    let nextPageToken: string | undefined;

    // Maximum items to fetch to avoid excessive API calls
    const MAX_ITEMS = 50;  // Original code used 50
    let totalItemsFetched = 0;

    try {
      do {
        console.log(`Fetching playlist items page with token: ${nextPageToken || 'initial'}`);

        const itemsParams = new URLSearchParams({
          part: "snippet,contentDetails",
          playlistId: playlistId,
          maxResults: "50", // Maximum allowed by API
          key: config.youtube.apiKey,
          ...(nextPageToken ? { pageToken: nextPageToken } : {})
        }).toString();

        const itemsResponse = await fetch(
          `${config.youtube.apiUrl}/playlistItems?${itemsParams}`,
          fetchOptions
        );

        if (!itemsResponse.ok) {
          if (videos.length > 0) {
            // If we already have some videos, continue with those instead of failing
            console.warn(`Error fetching more playlist items: ${itemsResponse.status}`);
            break;
          }
          // Otherwise handle the error
          throw new Error(`Failed to fetch playlist items: ${itemsResponse.status}`);
        }

        const itemsData = await itemsResponse.json();
        if (!itemsData.items?.length) {
          console.log('No items found in this page');
          break;
        }

        // Collect video IDs for bulk fetching
        const videoIds = itemsData.items
          .filter((item: any) => item.contentDetails?.videoId || (item.snippet?.resourceId?.videoId))
          .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId);

        console.log(`Found ${videoIds.length} video IDs in playlist`);

        if (videoIds.length > 0) {
          try {
            // IMPORTANT: Fetch detailed information for videos
            const videoParams = new URLSearchParams({
              part: "contentDetails,statistics,snippet",
              id: videoIds.join(","),
              key: config.youtube.apiKey
            }).toString();

            const videoResponse = await fetch(
              `${config.youtube.apiUrl}/videos?${videoParams}`,
              fetchOptions
            );

            let videoDetailsMap = new Map();

            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              if (videoData.items?.length) {
                videoDetailsMap = new Map(
                  videoData.items.map((item: any) => [item.id, item])
                );
              }
            }

            // Map the playlist items to our VideoItem format with all the details
            const currentBatchVideos = itemsData.items
              .filter((item: any) => {
                const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
                return !!videoId;
              })
              .map((item: any) => {
                try {
                  const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
                  if (!videoId) {
                    console.warn("Missing video ID in playlist item:", item);
                    return null;
                  }
                  
                  const videoDetails = videoDetailsMap.get(videoId);
                  const thumbnails = item.snippet?.thumbnails || {};
                  
                  // Make sure we handle all date formatting properly
                  let publishDate = "";
                  try {
                    const publishDateStr = item.contentDetails?.videoPublishedAt || 
                                          item.snippet?.publishedAt || 
                                          (videoDetails?.snippet?.publishedAt || "");
                    
                    if (publishDateStr) {
                      const date = new Date(publishDateStr);
                      if (!isNaN(date.getTime())) {
                        publishDate = date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      }
                    }
                  } catch (dateError) {
                    console.warn("Error formatting date:", dateError);
                  }

                  return {
                    id: videoId,
                    videoId: videoId,
                    title: item.snippet?.title || "Untitled Video",
                    description: videoDetails?.snippet?.description || item.snippet?.description || "",
                    thumbnail: thumbnails.maxres?.url || 
                              thumbnails.standard?.url || 
                              thumbnails.high?.url || 
                              thumbnails.medium?.url || 
                              thumbnails.default?.url || "",
                    duration: videoDetails ? formatDuration(videoDetails.contentDetails?.duration || "") : "0:00",
                    channelId: item.snippet?.videoOwnerChannelId || item.snippet?.channelId || "",
                    channelName: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown",
                    views: videoDetails?.statistics ? formatViews(videoDetails.statistics.viewCount) : "0",
                    likes: videoDetails?.statistics ? formatViews(videoDetails.statistics.likeCount) : "0",
                    position: typeof item.snippet?.position === 'number' ? item.snippet.position : videos.length,
                    publishDate: publishDate
                  };
                } catch (itemError) {
                  console.warn("Error processing playlist item:", itemError);
                  return null;
                }
              })
              .filter(Boolean); // Filter out any null items

            videos.push(...currentBatchVideos);
          } catch (videoDetailsError) {
            console.error("Error processing video details:", videoDetailsError);
            // Continue with partial data
          }
        }

        totalItemsFetched += itemsData.items.length;
        nextPageToken = itemsData.nextPageToken;
        console.log(`Next page token: ${nextPageToken || 'none'}, total fetched: ${totalItemsFetched}`);

        // Break if we've reached our limit to prevent too many API calls
        if (totalItemsFetched >= MAX_ITEMS) {
          console.log(`Reached max items limit (${MAX_ITEMS}), stopping pagination`);
          break;
        }

      } while (nextPageToken);
    } catch (paginationError) {
      console.error("Error in playlist pagination:", paginationError);
      // If we already have some videos, don't fail completely
    }

    if (videos.length === 0) {
      throw new Error("No accessible videos found in playlist");
    }

    // Add the videos to our playlist data
    playlistData.videos = videos;

    // When caching, convert videoCount to number as required by the API
    try {
      if (videos.length > 0) {
        // Extract minimal data for caching
        const minimalVideos = videos.map(video => ({
          videoId: video.videoId,
          position: video.position
        }));

        // Convert videoCount to number for the cache API
        const videoCountNumber = parseInt(playlistData.videoCount) || videos.length;
        
        await getConvexClient().mutation(api.videos.cachePlaylist, {
          youtubeId: playlistId,
          title: playlistData.title || "Unknown Playlist",
          thumbnail: playlistData.thumbnail || "",
          channelId: playlistData.channelId || "",
          channelName: playlistData.channelName || "",
          videoCount: videoCountNumber, // Convert to number for the API
          videos: minimalVideos
        });
      }
    } catch (cacheError) {
      console.warn('Failed to cache playlist:', cacheError);
      // Continue even if caching fails
    }

    return playlistData;
  } catch (error) {
    console.error('Error fetching playlist data:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Helper function to format dates consistently
function formatDate(publishedAt: string): string {
  if (!publishedAt) return "";
  
  try {
    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) return ""; // Check if date is valid
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "";
  }
}
>>>>>>> master
