import { action } from "../_generated/server"
import { v } from "convex/values"
import { Innertube } from 'youtubei.js'
import { createApiError } from "../types"
import type { TranscriptSegment, VideoMetadata, ChannelMetadata } from "../youtube-types"

const fetch = globalThis.fetch

interface VideoCaptionSegment {
  text: string
  start: number
  duration: number
}

interface VideoCaptions {
  getCaptions(): Promise<{
    getByLanguage(code: string): Promise<any[]>
    getDefault(): Promise<any>
  }>
}

interface VideoBasicInfo {
  basic_info: {
    id: string
    title: string
    description?: string
    thumbnails?: Array<{ url: string }>
    duration?: { text: string }
    channel_id?: string
    author?: string
    view_count?: { text: string }
    like_count?: number
  }
  captions?: VideoCaptions
}

interface Channel {
  metadata: {
    title?: string
    description?: string
    thumbnail?: Array<{ url: string }>
    subscriberCount?: string
    videosCount?: string
  }
}

export const getTranscript = action({
  args: {
    videoId: v.string(),
    language: v.optional(v.string())
  },
  handler: async (_ctx, args): Promise<TranscriptSegment[]> => {
    try {
      const youtube = await Innertube.create({
        generate_session_locally: true,
        fetch
      })

      const info = await youtube.getInfo(args.videoId) as any
      const captions = info.captions

      if (!captions) {
        throw new Error("No captions available for this video")
      }

      let captionTrack: any = null
      if (args.language) {
        const tracks = await captions.getByLanguage(args.language)
        if (tracks?.length > 0) {
          captionTrack = tracks[0]
        }
      }

      if (!captionTrack) {
        captionTrack = await captions.getDefault()
      }

      if (!captionTrack) {
        throw new Error("No suitable caption track found")
      }

      const segments = await captionTrack.fetch()
      return segments.map((segment: any) => ({
        text: segment.text || '',
        startTime: segment.start?.toString() || '0',
        duration: segment.duration?.toString() || '0'
      }))

    } catch (error) {
      throw createApiError(
        "INTERNAL_ERROR",
        `Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: String(error) }
      )
    }
  }
})

export const getVideoDetails = action({
  args: {
    videoId: v.string()
  },
  handler: async (_ctx, args): Promise<VideoMetadata> => {
    try {
      const youtube = await Innertube.create({
        generate_session_locally: true,
        fetch
      })

      const video = await youtube.getBasicInfo(args.videoId)

      return {
        id: video.basic_info.id || args.videoId,
        title: video.basic_info.title || '',
        description: video.basic_info.short_description || '',
        thumbnail: video.basic_info.thumbnail?.[0]?.url || '',
        duration: video.basic_info.duration?.toString() || '0:00',
        channelId: video.basic_info.channel_id || '',
        channelName: video.basic_info.author || '',
        views: video.basic_info.view_count?.toString() || '0',
        likes: video.basic_info.like_count?.toString() || '0',
        publishDate: new Date().toISOString() // Using current date as fallback
      }
    } catch (error) {
      throw createApiError(
        "INTERNAL_ERROR",
        `Failed to fetch video details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: String(error) }
      )
    }
  }
})

export const getChannelDetails = action({
  args: {
    channelId: v.string()
  },
  handler: async (_ctx, args): Promise<ChannelMetadata> => {
    try {
      const youtube = await Innertube.create({
        generate_session_locally: true,
        fetch
      })

      const channel = await youtube.getChannel(args.channelId) as any
      const channelData = channel.header

      return {
        id: args.channelId,
        title: channelData?.title || '',
        description: channelData?.description || '',
        thumbnail: channelData?.avatar?.[0]?.url || '',
        subscriberCount: channelData?.subscriberCount || '0',
        videoCount: channelData?.videosCount || '0',
        joinDate: new Date().toISOString() // Using current date as fallback
      }
    } catch (error) {
      throw createApiError(
        "INTERNAL_ERROR",
        `Failed to fetch channel details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: String(error) }
      )
    }
  }
})
