import { Innertube } from 'youtubei.js'
import { VideoDetails } from '@/types/youtube'

interface YouTubeVideoData {
  id: string
  title: string
  thumbnail: string
  duration: string
  channel_id: string
  channel_name: string
  views: string
  description: string
}

export interface PlaylistDetails {
  id: string
  title: string
  thumbnail: string
  videoCount: number
  channel: string
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
  try {
    const youtube = await Innertube.create({
      generate_session_locally: true,
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
    })

    const playlist = await youtube.getPlaylist(playlistId)
    if (!playlist) {
      throw new Error('Playlist information not found')
    }

    return {
      id: playlistId,
      title: playlist.info.title || '',
      thumbnail: playlist.info.thumbnails?.[0]?.url || '',
      videoCount: Number(playlist.info.total_items) || 0,
      channel: playlist.info.author?.name || ''
    }
  } catch (error) {
    console.error('Error fetching playlist data:', error)
    throw new Error('Failed to fetch playlist data')
  }
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  try {
    const youtube = await Innertube.create({
      generate_session_locally: true,
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
    })

    const video = await youtube.getInfo(videoId)
    
    if (!video) {
      throw new Error('Video information not found')
    }

    // Format duration string (input is in seconds)
    const formatDuration = (duration: number): string => {
      if (!duration) return '0:00'
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Get the highest quality thumbnail
    const getBestThumbnail = (thumbnails: any[]): string => {
      return thumbnails?.reduce((best, current) => {
        if (!best || (current.height > best.height)) return current
        return best
      }, null)?.url || ''
    }

    // Use current date since publishDate is not reliably available from the API
    const date = new Date()
    
    return {
      id: videoId,
      type: "video",
      title: video.basic_info.title || '',
      thumbnail: getBestThumbnail(video.basic_info.thumbnail || []),
      duration: formatDuration(video.basic_info.duration || 0),
      channelId: video.basic_info.channel_id || '',
      channelName: video.basic_info.author || '',
      views: video.basic_info.view_count?.toString() || '0',
      likes: video.basic_info.like_count?.toString() || '0',
      description: video.basic_info.short_description || '',
      publishDate: date.toISOString()
    }
  } catch (error) {
    console.error('Error fetching YouTube data:', error)
    if (error instanceof Error && error.message.includes('Video unavailable')) {
      throw new Error('Video not available or does not exist')
    }
    throw new Error('Failed to fetch video data')
  }
}
