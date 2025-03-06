import { Innertube } from 'youtubei.js'

export interface YouTubeVideoData {
  id: string
  title: string
  thumbnail: string
  duration: string
  channel_id: string
  channel_name: string
  views: string
  description: string
}

export async function getYouTubeData(videoId: string): Promise<YouTubeVideoData> {
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

    return {
      id: videoId,
      title: video.basic_info.title || '',
      thumbnail: getBestThumbnail(video.basic_info.thumbnail || []),
      duration: formatDuration(video.basic_info.duration || 0),
      channel_id: video.basic_info.channel_id || '',
      channel_name: video.basic_info.author || '',
      views: video.basic_info.view_count?.toString() || '0',
      description: video.basic_info.short_description || '',
    }
  } catch (error) {
    console.error('Error fetching YouTube data:', error)
    if (error instanceof Error && error.message.includes('Video unavailable')) {
      throw new Error('Video not available or does not exist')
    }
    throw new Error('Failed to fetch video data')
  }
}
