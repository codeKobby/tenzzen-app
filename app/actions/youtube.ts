"use server"

import { z } from "zod"

// Types to match the component interfaces
export interface VideoDetails {
  type: "video"
  id: string
  title: string
  description: string
  thumbnail: string
  channelName: string
  channelAvatar?: string
  likes: string
  views: string
  publishDate: string
  duration: string
}

export interface VideoItem {
  id: string
  title: string
  thumbnail: string
  channelName: string
  views: string
  publishDate: string
  duration: string
  description?: string
  videoPublishedAt?: string
  videoOwnerChannelTitle?: string
  videoOwnerChannelId?: string
}

export interface PlaylistDetails {
  type: "playlist"
  id: string
  title: string
  description: string
  thumbnail: string
  channelName: string
  channelAvatar?: string
  videoCount: number
  videos: VideoItem[]
}

// YouTube API key from environment variables
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error("YouTube API key is not configured");
}

const baseUrl = 'https://www.googleapis.com/youtube/v3';
const headers = {
  'Referer': 'https://localhost:3000',
  'Origin': 'https://localhost:3000'
};

/**
 * Server action to fetch YouTube video details
 */
export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  try {
    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: videoId,
      key: YOUTUBE_API_KEY as string
    } as Record<string, string>);

    // Fetch video details
    const response = await fetch(`${baseUrl}/videos?${params}`, { headers });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Check if video exists
    if (!data.items || data.items.length === 0) {
      throw new Error("Video not found");
    }

    const videoData = data.items[0];
    const { snippet, statistics, contentDetails } = videoData;

    // Fetch channel details
    const channelParams = new URLSearchParams({
      part: 'snippet',
      id: snippet.channelId,
      key: YOUTUBE_API_KEY as string
    } as Record<string, string>);

    const channelResponse = await fetch(`${baseUrl}/channels?${channelParams}`, { headers });
    let channelAvatar;
    
    if (channelResponse.ok) {
      const channelData = await channelResponse.json();
      if (channelData.items?.[0]?.snippet?.thumbnails?.default?.url) {
        channelAvatar = channelData.items[0].snippet.thumbnails.default.url;
      }
    }

    // Format the data
    return {
      type: "video",
      id: videoId,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.maxres?.url || 
                snippet.thumbnails.high?.url || 
                snippet.thumbnails.medium?.url || 
                snippet.thumbnails.default.url,
      channelName: snippet.channelTitle,
      channelAvatar,
      likes: formatCount(statistics.likeCount || "0"),
      views: formatCount(statistics.viewCount || "0"),
      publishDate: formatDate(snippet.publishedAt),
      duration: formatDuration(contentDetails.duration),
    };
  } catch (error) {
    console.error("Error fetching video details:", error);
    throw new Error("Failed to fetch video details");
  }
}

/**
 * Server action to fetch YouTube playlist details
 */
export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
  try {
    // Fetch playlist details
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      id: playlistId,
      key: YOUTUBE_API_KEY as string
    } as Record<string, string>);

    const response = await fetch(`${baseUrl}/playlists?${params}`, { headers });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`YouTube API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("Playlist not found");
    }

    const playlistData = data.items[0];
    const { snippet, contentDetails } = playlistData;

    // Fetch playlist items
    const videos: VideoItem[] = [];
    let nextPageToken: string | undefined;
    const maxResults = 50;

    do {
      const itemsParams = new URLSearchParams({
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: maxResults.toString(),
        key: YOUTUBE_API_KEY as string
      } as Record<string, string>);

      if (nextPageToken) {
        itemsParams.append('pageToken', nextPageToken);
      }

      const itemsResponse = await fetch(`${baseUrl}/playlistItems?${itemsParams}`, { headers });
      
      if (!itemsResponse.ok) {
        break;
      }

      const itemsData = await itemsResponse.json();
      nextPageToken = itemsData.nextPageToken;

      for (const item of itemsData.items) {
        const video: VideoItem = {
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.maxres?.url || 
                    item.snippet.thumbnails.high?.url || 
                    item.snippet.thumbnails.medium?.url || 
                    item.snippet.thumbnails.default.url,
          channelName: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
          views: "N/A",
          publishDate: formatDate(item.snippet.publishedAt),
          duration: "N/A",
          description: item.snippet.description,
          videoPublishedAt: item.contentDetails?.videoPublishedAt,
          videoOwnerChannelTitle: item.snippet.videoOwnerChannelTitle,
          videoOwnerChannelId: item.snippet.videoOwnerChannelId
        };

        videos.push(video);

        if (videos.length >= maxResults) break;
      }
    } while (nextPageToken && videos.length < maxResults);

    // Get details for first few videos
    const detailsCount = Math.min(5, videos.length);
    for (let i = 0; i < detailsCount; i++) {
      try {
        const videoDetails = await getVideoDetails(videos[i].id);
        videos[i].views = videoDetails.views;
        videos[i].duration = videoDetails.duration;
      } catch (error) {
        console.error(`Error fetching details for video ${videos[i].id}:`, error);
      }
    }

    // Fetch channel avatar
    const channelParams = new URLSearchParams({
      part: 'snippet',
      id: snippet.channelId,
      key: YOUTUBE_API_KEY as string
    } as Record<string, string>);

    const channelResponse = await fetch(`${baseUrl}/channels?${channelParams}`, { headers });
    let channelAvatar;
    
    if (channelResponse.ok) {
      const channelData = await channelResponse.json();
      if (channelData.items?.[0]?.snippet?.thumbnails?.default?.url) {
        channelAvatar = channelData.items[0].snippet.thumbnails.default.url;
      }
    }

    return {
      type: "playlist",
      id: playlistId,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.maxres?.url || 
                snippet.thumbnails.high?.url || 
                snippet.thumbnails.medium?.url || 
                snippet.thumbnails.default.url,
      channelName: snippet.channelTitle,
      channelAvatar,
      videoCount: contentDetails.itemCount,
      videos
    };
  } catch (error) {
    console.error("Error fetching playlist details:", error);
    throw new Error("Failed to fetch playlist details");
  }
}

// Helper functions
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function formatCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return count;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}
