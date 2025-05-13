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
        new Date(video.snippet.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '';

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
                    safeGet(item, 'snippet.thumbnails.default.url') || '',
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
