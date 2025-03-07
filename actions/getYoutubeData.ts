'use server'

import type { VideoDetails, PlaylistDetails } from '@/types/youtube'
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
const parseISO8601Duration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '0:00'

  const hours = parseInt(match[1]?.replace('H', '') || '0')
  const minutes = parseInt(match[2]?.replace('M', '') || '0')
  const seconds = parseInt(match[3]?.replace('S', '') || '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

export async function getVideoDetails(videoId: string) {
  'use server'
  try {
    // Check cache first
    const cachedVideo = await getConvexClient().query(api.videos.getCachedVideo, { youtubeId: videoId })
    if (cachedVideo) {
      const { youtubeId, cachedAt, _id, _creationTime, ...videoData } = cachedVideo
      return {
        id: videoId,
        type: "video",
        ...videoData
      }
    }

    // Log request details for debugging
    console.log(`Fetching video details for ID: ${videoId}`);

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
    const duration = video.contentDetails?.duration ? 
      parseISO8601Duration(video.contentDetails.duration) : 
      '0:00';

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
      views: safeGet(video, 'statistics.viewCount', '0'),
      likes: safeGet(video, 'statistics.likeCount', '0'),
      publishDate: safeGet(video, 'snippet.publishedAt', '') ? 
        new Date(video.snippet.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
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
    console.error('Error fetching YouTube data:', error)
    
    // Check for specific API errors
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('YouTube API quota exceeded. Please try again later.')
      }
      if (error.message.includes('403')) {
        throw new Error('Access to this video is restricted in your region.')
      }
      if (error.message.includes('404') || error.message.includes('Video not found')) {
        throw new Error('Video not found or has been removed.')
      }
      
      // Return the actual error message for debugging
      throw new Error(`Failed to fetch video data: ${error.message}`)
    }
    
    throw new Error('Failed to fetch video data')
  }
}

export async function getPlaylistDetails(playlistId: string, fetchVideoDetails = false) {
  'use server'
  try {
    // Check cache first
    const cachedPlaylist = await getConvexClient().query(api.videos.getCachedPlaylist, { youtubeId: playlistId })
    if (cachedPlaylist) {
      const { youtubeId, cachedAt, _id, _creationTime, ...playlistData } = cachedPlaylist
      // Transform and validate playlist data
      const videos = (playlistData.videos || []).map(video => {
        if ('videoId' in video && 'position' in video) {
          return {
            videoId: video.videoId,
            position: video.position
          }
        }
        return null
      }).filter((v): v is { videoId: string; position: number } => v !== null)

      return {
        id: playlistId,
        type: "playlist",
        ...playlistData,
        videos
      }
    }

    // Log request details for debugging
    console.log(`Fetching playlist details for ID: ${playlistId}`);

    // Fetch playlist details from YouTube Data API
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
    
    // Log response for debugging
    console.log('YouTube API playlist response received:', JSON.stringify(data, null, 2).substring(0, 500) + '...');

    // Handle YouTube API errors
    if (data.error) {
      const error = data.error
      if (error.errors?.[0]) {
        const detail = error.errors[0]
        if (detail.reason === 'quotaExceeded') {
          throw new Error('YouTube API quota exceeded. Please try again later.')
        }
        if (detail.reason === 'playlistNotFound') {
          throw new Error('Playlist not found or has been removed.')
        }
        if (detail.reason === 'invalidPlaylist') {
          throw new Error('Invalid playlist ID.')
        }
        throw new Error(detail.message || 'YouTube API error')
      }
      throw new Error(error.message || 'YouTube API error')
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
        const channelResponse = await fetch(
          `${config.youtube.apiUrl}/channels?part=snippet&id=${channelId}&key=${config.youtube.apiKey}`,
          fetchOptions
        )

        if (channelResponse.ok) {
          const channelData = await channelResponse.json()
          const channel = channelData.items?.[0]
          if (channel?.snippet?.thumbnails?.default?.url) {
            channelAvatar = channel.snippet.thumbnails.default.url
          }
        } else {
          console.warn('Failed to fetch playlist channel avatar, continuing without it')
        }
      }
    } catch (channelError) {
      // Don't fail the whole request if channel fetch fails
      console.warn('Error fetching channel details for playlist:', channelError)
    }

    const publishDate = playlist.snippet.publishedAt ? 
      new Date(playlist.snippet.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Unknown date';

    const playlistData = {
      youtubeId: playlistId,
      title: safeGet(playlist, 'snippet.title', 'Unknown playlist'),
      description: safeGet(playlist, 'snippet.description', ''),
      thumbnail,
      channelId,
      channelName: channelTitle,
      channelAvatar,
      publishDate,
      videoCount: parseInt(safeGet(playlist, 'contentDetails.itemCount', '0')),
      videos: [] as Array<{ videoId: string; position: number }>
    }

    // Get playlist items if requested
    if (fetchVideoDetails) {
      let pageToken: string | undefined
      try {
        do {
          const itemsResponse = await fetch(
            `${config.youtube.apiUrl}/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${config.youtube.apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`,
            fetchOptions
          )

          if (!itemsResponse.ok) {
            const responseText = await itemsResponse.text()
            console.error('YouTube API playlist items error:', {
              status: itemsResponse.status,
              response: responseText
            })
            break; // Don't fail the entire request, just stop getting more items
          }

          const itemsData = await itemsResponse.json()

          if (itemsData.error) {
            console.error('YouTube API playlist items error:', itemsData.error)
            break; // Don't fail the entire request, just stop getting more items
          }

          // Safely extract video items
          if (itemsData.items && Array.isArray(itemsData.items)) {
            const validItems = itemsData.items.filter(item => 
              item?.snippet?.resourceId?.videoId && 
              typeof item.snippet.position === 'number'
            );
            
            playlistData.videos.push(
              ...validItems.map((item) => ({
                videoId: item.snippet.resourceId.videoId,
                position: item.snippet.position
              }))
            )
          }

          pageToken = itemsData.nextPageToken
        } while (pageToken && playlistData.videos.length < playlistData.videoCount)
      } catch (playlistItemsError) {
        console.error('Error fetching playlist items:', playlistItemsError);
        // Continue with the playlist data we have so far
      }
    }

    // Cache playlist data
    try {
      await getConvexClient().mutation(api.videos.cachePlaylist, playlistData)
    } catch (cachingError) {
      console.error('Error caching playlist data:', cachingError);
      // Continue even if caching fails
    }

    return {
      id: playlistId,
      type: "playlist",
      ...playlistData
    }
  } catch (error) {
    console.error('Error fetching playlist data:', error)
    
    // Check for specific API errors
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('YouTube API quota exceeded. Please try again later.')
      }
      if (error.message.includes('403')) {
        throw new Error('Access to this playlist is restricted.')
      }
      if (error.message.includes('404') || error.message.includes('Playlist not found')) {
        throw new Error('Playlist not found or has been removed.')
      }
      if (error.message.includes('invalidRequest')) {
        throw new Error('Invalid playlist ID.')
      }
      
      // Return the actual error message for debugging
      throw new Error(`Failed to fetch playlist data: ${error.message}`)
    }
    
    throw new Error('Failed to fetch playlist data')
  }
}
