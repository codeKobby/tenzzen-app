import { action } from "../_generated/server"
import { v } from "convex/values"
import { Innertube } from 'youtubei.js'
import { createApiError } from "../types"
import type { CaptionSegment, VideoMetadata, ChannelMetadata } from "./youtube-types"

interface TranscriptSegment {
  text: string
  duration: number
  offset: number
}

// Get transcript using YouTubeI
export const getTranscript = action({
  args: {
    videoId: v.string(),
    language: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<TranscriptSegment[]> => {
    try {
      const youtube = await Innertube.create({
        generate_session_locally: true,
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
      })

      const info = await youtube.getInfo(args.videoId)
      const captions = info.captions

      if (!captions) {
        throw new Error("No captions available for this video")
      }

      // Get available caption tracks
      let captionTrack = captions.getDefaultCaptions()
      if (args.language) {
        const tracks = captions.getByLanguage(args.language)
        if (tracks && tracks.length > 0) {
          captionTrack = tracks[0]
        }
      }

      if (!captionTrack) {
        throw new Error("No suitable caption track found")
      }

      const segments = await captionTrack.getSegments()
      return segments.map(segment => ({
        text: segment.text,
        duration: segment.duration,
        offset: segment.start
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

// Get video details using YouTubeI
export const getVideoDetails = action({
  args: {
    videoId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const youtube = await Innertube.create({
        generate_session_locally: true,
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
      })

      const info = await youtube.getInfo(args.videoId)
      const { basic_info, primary_info, secondary_info } = info

      return {
        id: basic_info.video_id,
        title: basic_info.title,
        description: primary_info?.description_text || "",
        duration: basic_info.duration?.text || "0:00",
        thumbnail: basic_info.thumbnail?.[0]?.url || "",
        channelId: basic_info.channel_id,
        channelName: basic_info.author,
        views: basic_info.view_count?.text || "0",
        likes: primary_info?.like_count?.text || "0",
        publishDate: basic_info.published?.text || new Date().toISOString()
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

// Get channel details using YouTubeI
export const getChannelDetails = action({
  args: {
    channelId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const youtube = await Innertube.create({
        generate_session_locally: true,
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
      })

      const browse = await youtube.getChannel(args.channelId)
      const meta = browse.metadata

      return {
        id: args.channelId,
        name: meta.title || "",
        description: meta.description || "",
        thumbnail: meta.avatar_thumbnails?.[0]?.url || "",
        subscriberCount: meta.subscriber_count || "0",
        videoCount: meta.video_count?.toString() || "0",
        joinDate: meta.join_date || new Date().toISOString()
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
