"use server"

import { headers } from "next/headers"
import type { VideoDetails, PlaylistDetails, VideoItem } from "@/types/youtube"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
if (!YOUTUBE_API_KEY) {
  console.warn("YouTube API key is not configured - some features may not work")
}

const baseUrl = "https://www.googleapis.com/youtube/v3"

// Maximum number of retry attempts for API calls
const MAX_RETRIES = 2
// Delay between retries (ms)
const RETRY_DELAY = 1000

async function getRequestHeaders() {
  // Default headers for server-side requests
  const requestHeaders: Record<string, string> = {
    "Accept": "application/json"
    // Don't include Content-Type for GET requests
  }

  // Try to get actual headers if running in a browser context
  try {
    // Get headers and await the promise
    const headersList = await headers();
    const origin = headersList.get("origin");
    const referer = headersList.get("referer");

    if (origin) requestHeaders["Origin"] = origin;
    if (referer) requestHeaders["Referer"] = referer;
  } catch (error) {
    // Silently handle errors when headers() is called in contexts where it's not available
    console.warn("Failed to get request headers:", error);
  }

  return requestHeaders;
}

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function for API fetch with retry logic
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options)
    
    // If the response is rate limiting (429) or server error (5xx), retry
    if ((response.status === 429 || (response.status >= 500 && response.status < 600)) && retries > 0) {
      console.warn(`Retrying API call due to ${response.status} status. Retries left: ${retries}`)
      await delay(RETRY_DELAY)
      return fetchWithRetry(url, options, retries - 1)
    }
    
    return response
  } catch (error) {
    if (retries > 0) {
      console.warn(`API call failed with error, retrying. Retries left: ${retries}`, error)
      await delay(RETRY_DELAY)
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

const formatDuration = (duration: string): string => {
  if (!duration) return "0:00";
  
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
  if (!viewCount) return "0";
  
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

const formatDate = (publishedAt: string): string => {
  if (!publishedAt) return ""
  
  try {
    const date = new Date(publishedAt)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  } catch (error) {
    return ""
  }
}

interface YoutubeVideoItem {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default: { url: string }
      medium?: { url: string }
      high?: { url: string }
      standard?: { url: string }
      maxres?: { url: string }
    }
    channelId: string
    channelTitle: string
    publishedAt: string
  }
  contentDetails: {
    duration: string
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
  }
}

interface YoutubeVideoDetails {
  items: YoutubeVideoItem[]
  pageInfo?: {
    totalResults: number
  }
}

interface YoutubePlaylistDetails {
  items: Array<{
    id: string
    snippet: {
      title: string
      description: string
      thumbnails: {
        default: { url: string }
        medium?: { url: string }
        high?: { url: string }
        standard?: { url: string }
        maxres?: { url: string }
      }
      channelId: string
      channelTitle: string
      publishedAt?: string
    }
    contentDetails: {
      itemCount: number
    }
    statistics?: {
      viewCount?: string
    }
  }>
  pageInfo?: {
    totalResults: number
  }
}

interface YoutubePlaylistItem {
  contentDetails: {
    videoId: string
    videoPublishedAt?: string
  }
  snippet: {
    title: string
    description: string
    thumbnails: {
      default: { url: string }
      medium?: { url: string }
      high?: { url: string }
      standard?: { url: string }
      maxres?: { url: string }
    }
    videoOwnerChannelId?: string
    videoOwnerChannelTitle?: string
    channelId?: string
    channelTitle?: string
    position: number
    publishedAt: string
  }
}

interface YoutubePlaylistItems {
  items: YoutubePlaylistItem[]
  nextPageToken?: string
  pageInfo?: {
    totalResults: number
    resultsPerPage: number
  }
}

interface YouTubeErrorDetail {
  message: string;
  domain: string;
  reason: string;
  location?: string;
  locationType?: string;
}

interface ApiErrorResponse {
  error: {
    code: number;
    message: string;
    errors?: YouTubeErrorDetail[];
    status?: string;
  };
}

class YouTubeApiError extends Error {
  code: number;
  details?: YouTubeErrorDetail[];
  status?: string;

  constructor(message: string, code: number, details?: YouTubeErrorDetail[], status?: string) {
    super(message);
    this.name = 'YouTubeApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage = "Failed to fetch data from YouTube";
  let errorCode = response.status;
  let errorDetails: YouTubeErrorDetail[] | undefined;
  let status: string | undefined;
  
  try {
    const errorData: ApiErrorResponse = await response.json();
    if (errorData?.error) {
      errorMessage = errorData.error.message;
      errorCode = errorData.error.code;
      errorDetails = errorData.error.errors;
      status = errorData.error.status;
      
      // Check for specific error types
      switch (errorCode) {
        case 400:
          errorMessage = "Invalid request parameters. Please check your input.";
          break;
        case 401:
          errorMessage = "Unauthorized access to YouTube content. Please check your API key.";
          break;
        case 403:
          if (errorMessage.includes("quota")) {
            errorMessage = "YouTube API quota exceeded. Please try again later.";
          } else {
            errorMessage = "Access forbidden. Please check your API permissions.";
          }
          break;
        case 404:
          errorMessage = "Content not found on YouTube.";
          break;
        case 429:
          errorMessage = "Too many requests. Please try again later.";
          break;
        case 500:
        case 503:
          errorMessage = "YouTube service is currently unavailable. Please try again later.";
          break;
      }
      
      // Add more specific error context if available
      if (errorDetails?.[0]) {
        errorMessage += ` (${errorDetails[0].reason}: ${errorDetails[0].message})`;
      }
    }
  } catch (e) {
    // If we can't parse the error, use the HTTP status text
    errorMessage = `YouTube API Error: ${response.statusText || response.status}`;
  }
  
  throw new YouTubeApiError(errorMessage, errorCode, errorDetails, status);
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  if (!videoId?.trim()) {
    throw new YouTubeApiError("Video ID is required", 400);
  }

  if (!YOUTUBE_API_KEY) {
    throw new YouTubeApiError("YouTube API key is not configured", 401);
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: videoId,
    key: YOUTUBE_API_KEY!
  }).toString();

  try {
    const response = await fetchWithRetry(`${baseUrl}/videos?${params}`, { 
      headers: await getRequestHeaders(),
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data: YoutubeVideoDetails = await response.json();
    
    if (!data.items?.length) {
      throw new YouTubeApiError("Video not found", 404);
    }

    const video = data.items[0];
    
    // Safely access nested properties
    const thumbnails = video.snippet?.thumbnails || {};
    
    const details: VideoDetails = {
      id: videoId,
      type: "video",
      title: video.snippet?.title || "Untitled Video",
      description: video.snippet?.description || "",
      thumbnail: thumbnails.maxres?.url || 
                thumbnails.standard?.url ||
                thumbnails.high?.url || 
                thumbnails.medium?.url ||
                thumbnails.default?.url || "",
      duration: formatDuration(video.contentDetails?.duration || ""),
      channelId: video.snippet?.channelId || "",
      channelName: video.snippet?.channelTitle || "Unknown Channel",
      views: formatViews(video.statistics?.viewCount || "0"),
      likes: formatViews(video.statistics?.likeCount || "0"),
      publishDate: formatDate(video.snippet?.publishedAt || ""),
    };

    // Get channel avatar
    try {
      if (details.channelId) {
        const channelParams = new URLSearchParams({
          part: "snippet",
          id: details.channelId,
          key: YOUTUBE_API_KEY!
        }).toString();

        const channelResponse = await fetchWithRetry(`${baseUrl}/channels?${channelParams}`, {
          headers: await getRequestHeaders(),
          next: { revalidate: 86400 } // Cache for 24 hours
        });

        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          if (channelData.items?.[0]?.snippet?.thumbnails?.default?.url) {
            details.channelAvatar = channelData.items[0].snippet.thumbnails.default.url;
          }
        }
      }
    } catch (error) {
      // Don't fail if we can't get the avatar, it's optional
      console.warn("Failed to fetch channel avatar:", error);
    }

    return details;
  } catch (error) {
    // Re-throw YouTube API errors as is
    if (error instanceof YouTubeApiError) {
      throw error;
    }
    
    // Handle other errors
    console.error("Error in getVideoDetails:", error);
    throw new YouTubeApiError(
      `Failed to fetch video details: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
  if (!playlistId?.trim()) {
    throw new YouTubeApiError("Playlist ID is required", 400);
  }

  if (!YOUTUBE_API_KEY) {
    throw new YouTubeApiError("YouTube API key is not configured", 401);
  }

  // First get playlist info
  const playlistParams = new URLSearchParams({
    part: "snippet,contentDetails",
    id: playlistId,
    key: YOUTUBE_API_KEY
  }).toString();

  let playlistData: YoutubePlaylistDetails;
  
  try {
    const playlistResponse = await fetchWithRetry(`${baseUrl}/playlists?${playlistParams}`, {
      headers: await getRequestHeaders(),
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!playlistResponse.ok) {
      await handleApiError(playlistResponse);
    }

    playlistData = await playlistResponse.json();
    
    if (!playlistData.items?.length) {
      throw new YouTubeApiError("Playlist not found", 404);
    }
  } catch (error) {
    if (error instanceof YouTubeApiError) {
      throw error;
    }
    throw new YouTubeApiError(
      `Failed to fetch playlist details: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }

  const playlist = playlistData.items[0];
  const videos: VideoItem[] = [];
  let nextPageToken: string | undefined;
  
  // Maximum items to fetch to avoid excessive API calls
  const MAX_ITEMS = 50;
  let totalItemsFetched = 0;

  // Get playlist items using pagination
  try {
    do {
      const itemsParams = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId: playlistId,
        maxResults: "50", // Maximum allowed by API
        key: YOUTUBE_API_KEY!,
        ...(nextPageToken ? { pageToken: nextPageToken } : {})
      }).toString();

      const itemsResponse = await fetchWithRetry(`${baseUrl}/playlistItems?${itemsParams}`, {
        headers: await getRequestHeaders(),
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!itemsResponse.ok) {
        if (videos.length > 0) {
          // If we already have some videos, continue with those instead of failing
          console.warn(`Error fetching more playlist items: ${itemsResponse.status}`);
          break;
        }
        await handleApiError(itemsResponse);
      }

      const itemsData: YoutubePlaylistItems = await itemsResponse.json();
      if (!itemsData.items?.length) break;
      
      // Collect video IDs for bulk fetching
      const videoIds = itemsData.items
        .filter(item => item.contentDetails?.videoId)
        .map(item => item.contentDetails.videoId);

      if (videoIds.length > 0) {
        try {
          const videoParams = new URLSearchParams({
            part: "contentDetails,statistics",
            id: videoIds.join(","),
            key: YOUTUBE_API_KEY!
          }).toString();

          const videoResponse = await fetchWithRetry(`${baseUrl}/videos?${videoParams}`, {
            headers: await getRequestHeaders(),
            next: { revalidate: 3600 }
          });

          let videoDetailsMap = new Map<string, YoutubeVideoItem>();
          
          if (videoResponse.ok) {
            const videoData: YoutubeVideoDetails = await videoResponse.json();
            if (videoData.items?.length) {
              videoDetailsMap = new Map(
                videoData.items.map(item => [item.id, item])
              );
            }
          }

          // Map the playlist items to our VideoItem format
          const currentBatchVideos = itemsData.items
            .filter(item => item.contentDetails?.videoId)
            .map(item => {
              const videoId = item.contentDetails.videoId;
              const videoDetails = videoDetailsMap.get(videoId);
              const thumbnails = item.snippet?.thumbnails || {};
              
              const videoItem: VideoItem = {
                id: videoId,
                title: item.snippet?.title || "Untitled Video",
                description: item.snippet?.description || "",
                thumbnail: thumbnails.maxres?.url ||
                        thumbnails.standard?.url ||
                        thumbnails.high?.url ||
                        thumbnails.medium?.url ||
                        thumbnails.default?.url || "",
                duration: videoDetails ? formatDuration(videoDetails.contentDetails?.duration) : "0:00",
                channelId: item.snippet?.videoOwnerChannelId || item.snippet?.channelId || "",
                channelName: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown",
                views: videoDetails?.statistics ? formatViews(videoDetails.statistics.viewCount) : "0",
                publishDate: formatDate(
                  item.contentDetails?.videoPublishedAt ||
                  (item.snippet?.publishedAt ?? "") ||
                  ""
                )
              };
              return videoItem;
            });

          videos.push(...currentBatchVideos);
        } catch (error) {
          console.error("Error processing video details:", error);
          // Continue with partial data
        }
      }

      totalItemsFetched += itemsData.items.length;
      nextPageToken = itemsData.nextPageToken;
      
      // Break if we've reached our limit to prevent too many API calls
      if (totalItemsFetched >= MAX_ITEMS) break;
      
    } while (nextPageToken);
  } catch (error) {
    console.error("Error fetching playlist items:", error);
    // If we have no videos yet, throw the error
    if (videos.length === 0) {
      if (error instanceof YouTubeApiError) {
        throw error;
      }
      throw new YouTubeApiError(
        `Failed to fetch playlist videos: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
    // Otherwise continue with the videos we have
  }

  if (videos.length === 0) {
    throw new YouTubeApiError("No accessible videos found in playlist", 404);
  }

  // Default thumbnails in case we can't find any
  const thumbnails = playlist.snippet?.thumbnails || {};

  // Get channel avatar
  let channelAvatar: string | undefined;
  try {
    if (playlist.snippet?.channelId) {
      const channelParams = new URLSearchParams({
        part: "snippet",
        id: playlist.snippet.channelId,
        key: YOUTUBE_API_KEY!
      }).toString();

      const channelResponse = await fetchWithRetry(`${baseUrl}/channels?${channelParams}`, {
        headers: await getRequestHeaders(),
        next: { revalidate: 86400 } // Cache for 24 hours
      });

      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        if (channelData.items?.[0]?.snippet?.thumbnails?.default?.url) {
          channelAvatar = channelData.items[0].snippet.thumbnails.default.url;
        }
      }
    }
  } catch (error) {
    // Don't fail if we can't get the avatar
    console.warn("Failed to fetch channel avatar:", error);
  }

  return {
    id: playlistId,
    type: "playlist",
    title: playlist.snippet?.title || "Untitled Playlist",
    description: playlist.snippet?.description || "",
    thumbnail: thumbnails.maxres?.url || 
              thumbnails.standard?.url ||
              thumbnails.high?.url || 
              thumbnails.medium?.url ||
              thumbnails.default?.url || "",
    channelId: playlist.snippet?.channelId || "",
    channelName: playlist.snippet?.channelTitle || "Unknown Channel",
    channelAvatar,
    videoCount: String(playlist.contentDetails?.itemCount || videos.length),
    videos
  };
}
