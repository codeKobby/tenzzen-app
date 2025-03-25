'use server'

import type { VideoDetails, PlaylistDetails, VideoItem } from '@/types/youtube'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { config } from '@/lib/config'
import { identifyYoutubeIdType } from '@/lib/utils/youtube'

// Create Convex client for server-side operations
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

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  try {
    if (!videoId || videoId.trim() === '') {
      throw new Error('Invalid video ID: Empty ID provided');
    }

    // Fix: Wait for the result from identifyYoutubeIdType
    const { type: idType, id } = await identifyYoutubeIdType(videoId);
    if (idType !== 'video') {
      if (idType === 'playlist') {
        throw new Error('PLAYLIST_ID_PROVIDED');
      }
    }

    try {
      // Fix: Check if videos API exists before trying to use it
      if (api.videos?.getCachedVideo) {
        const cachedVideo = await getConvexClient().query(api.videos.getCachedVideo, { youtubeId: videoId })
        if (cachedVideo) {
          const { youtubeId, cachedAt, _id, _creationTime, ...videoData } = cachedVideo
          const typedResponse: VideoDetails = {
            id: videoId,
            type: "video" as const,
            title: videoData.title || "Untitled",
            description: videoData.description || "",
            thumbnail: videoData.thumbnail || "",
            duration: videoData.duration || "",
            channelId: videoData.channelId || "",
            channelName: videoData.channelName || "",
            channelAvatar: videoData.channelAvatar,
            views: videoData.views || "0",
            likes: videoData.likes || "0",
            publishDate: videoData.publishDate || ""
          }
          return typedResponse
        }
      }
    } catch (cacheError) {
      console.warn('Failed to retrieve from cache:', cacheError)
    }

    const apiResponse = await fetch(
      `${config.youtube.apiUrl}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${config.youtube.apiKey}`,
      fetchOptions
    )

    if (!apiResponse.ok) {
      throw new Error(`YouTube API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json()
    if (!data.items?.[0]) {
      throw new Error('Video not found')
    }

    const video = data.items[0]
    const videoDetails: VideoDetails = {
      id: videoId,
      type: "video" as const,
      title: safeGet(video, 'snippet.title', 'Unknown title'),
      description: safeGet(video, 'snippet.description', ''),
      thumbnail: safeGet(video, 'snippet.thumbnails.maxres.url') ||
                safeGet(video, 'snippet.thumbnails.high.url') ||
                safeGet(video, 'snippet.thumbnails.standard.url') ||
                '',
      duration: formatDuration(video.contentDetails?.duration || ""),
      channelId: safeGet(video, 'snippet.channelId', ''),
      channelName: safeGet(video, 'snippet.channelTitle', ''),
      channelAvatar: '',
      views: formatViews(safeGet(video, 'statistics.viewCount', '0')),
      likes: formatViews(safeGet(video, 'statistics.likeCount', '0')),
      publishDate: video.snippet?.publishedAt ? 
        new Date(video.snippet.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : ''
    }

    // Cache the video data
    try {
      // Fix: Check if videos API exists before trying to use it
      if (api.videos?.cacheVideo) {
        await getConvexClient().mutation(api.videos.cacheVideo, {
          youtubeId: videoId,
          ...videoDetails
        })
      }
    } catch (cacheError) {
      console.warn('Failed to cache video:', cacheError)
    }

    return videoDetails
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

export async function getPlaylistDetails(playlistId: string, fetchVideoDetails = true): Promise<PlaylistDetails> {
  try {
    if (!playlistId?.trim()) {
      throw new Error('Playlist ID is required')
    }

    const apiResponse = await fetch(
      `${config.youtube.apiUrl}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${config.youtube.apiKey}`,
      fetchOptions
    )

    if (!apiResponse.ok) {
      throw new Error(`YouTube API error: ${apiResponse.status}`)
    }

    const data = await apiResponse.json()
    if (!data.items?.[0]) {
      throw new Error('Playlist not found')
    }

    const playlist = data.items[0]
    const playlistDetails: PlaylistDetails = {
      id: playlistId,
      type: "playlist" as const,
      title: safeGet(playlist, 'snippet.title', 'Unknown playlist'),
      description: safeGet(playlist, 'snippet.description', ''),
      thumbnail: safeGet(playlist, 'snippet.thumbnails.maxres.url') ||
                safeGet(playlist, 'snippet.thumbnails.high.url') ||
                safeGet(playlist, 'snippet.thumbnails.standard.url') ||
                '',
      channelId: safeGet(playlist, 'snippet.channelId', ''),
      channelName: safeGet(playlist, 'snippet.channelTitle', ''),
      channelAvatar: '',
      itemCount: Number(safeGet(playlist, 'contentDetails.itemCount', '0')),
      publishDate: playlist.snippet?.publishedAt ?
        new Date(playlist.snippet.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '',
      publishedAt: playlist.snippet?.publishedAt || '',  // Include both for compatibility
      videos: [] // This will be populated with VideoItem[]
    }

    if (fetchVideoDetails) {
      const videos: VideoItem[] = []
      let nextPageToken: string | undefined

      do {
        const params = new URLSearchParams({
          part: "snippet,contentDetails",
          playlistId: playlistId,
          maxResults: "50",
          key: config.youtube.apiKey,
          ...(nextPageToken ? { pageToken: nextPageToken } : {})
        })

        const itemsResponse = await fetch(
          `${config.youtube.apiUrl}/playlistItems?${params}`,
          fetchOptions
        )

        if (!itemsResponse.ok) break

        const itemsData = await itemsResponse.json()
        if (!itemsData.items?.length) break

        const currentItems: VideoItem[] = itemsData.items.map((item: any, index: number) => ({
          id: item.snippet?.resourceId?.videoId || '',
          videoId: item.snippet?.resourceId?.videoId || '',
          title: item.snippet?.title || 'Untitled Video',
          description: item.snippet?.description || '',
          thumbnail: safeGet(item, 'snippet.thumbnails.maxres.url') ||
                    safeGet(item, 'snippet.thumbnails.high.url') ||
                    safeGet(item, 'snippet.thumbnails.standard.url') ||
                    '',
          channelId: item.snippet?.videoOwnerChannelId || '',
          channelName: item.snippet?.videoOwnerChannelTitle || '',
          duration: '',
          position: item.snippet?.position || index,
          publishDate: item.contentDetails?.videoPublishedAt ? 
            new Date(item.contentDetails.videoPublishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : ''
        }))

        videos.push(...currentItems)
        nextPageToken = itemsData.nextPageToken

      } while (nextPageToken && videos.length < 200)

      playlistDetails.videos = videos
    }

    return playlistDetails
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}