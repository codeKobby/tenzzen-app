'use server';

import { ConvexHttpClient } from "convex/browser";
import { Innertube } from 'youtubei.js';
import { createLogger } from "@/lib/debug-logger";
import { api } from "@/convex/_generated/api";

// Define the TranscriptSegment type directly in this file to avoid import issues
interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Initialize logger
const logger = createLogger("youtube-transcript");

// Initialize Convex client
let convexClient: ConvexHttpClient | null = null;
const getConvexClient = () => {
  if (!convexClient && process.env.NEXT_PUBLIC_CONVEX_URL) {
    convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  }
  return convexClient;
};

export async function getYoutubeTranscript(
  videoId: string,
  language: string = "en"
): Promise<TranscriptSegment[]> {
  try {
    // Check if transcript is already cached in video document
    logger.log('Checking for cached transcript in video document');
    const client = getConvexClient();
    if (client) {
      try {
        const cachedTranscript = await client.query(api.videos.getVideoTranscript, { 
          youtubeId: videoId,
          language: language
        });
        
        if (cachedTranscript && !('expired' in cachedTranscript)) {
          logger.log('Found valid cached transcript in video document');
          return cachedTranscript.segments;
        }
      } catch (cacheError) {
        logger.warn('Error retrieving transcript from video document:', cacheError);
      }
    }

    // Fetch from YouTube
    logger.log('Fetching transcript from YouTube');
    try {
      const youtube = await Innertube.create({
        generate_session_locally: true,
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
      });

      const video = await youtube.getInfo(videoId);
      if (!video.captions) {
        logger.warn('No captions available for this video');
        return [];
      }

      const tracks = video.captions.caption_tracks;
      if (!tracks || tracks.length === 0) {
        logger.warn('No caption tracks found');
        return [];
      }

      // Select track based on language
      const selectedTrack = language
        ? tracks.find(track => {
            const trackLang = track.language_code?.toLowerCase();
            const trackName = track.name?.text?.toLowerCase();
            const targetLang = language.toLowerCase();
            return trackLang === targetLang || trackName?.includes(targetLang);
          })
        : tracks[0];

      if (!selectedTrack || !selectedTrack.base_url) {
        logger.warn(
          language 
            ? `No captions available in language: ${language}` 
            : 'No caption track available'
        );
        return [];
      }

      // Fetch and parse transcript
      const response = await fetch(selectedTrack.base_url);
      if (!response.ok) {
        logger.warn('Failed to fetch transcript data');
        return [];
      }

      const transcriptXml = await response.text();
      const segments = parseTranscriptXml(transcriptXml);

      // Cache the transcript in the video document
      if (client && segments.length > 0) {
        try {
          logger.log('Caching transcript in video document');
          await client.mutation(api.videos.cacheVideoTranscript, {
            youtubeId: videoId,
            language: language,
            segments: segments,
            cachedAt: new Date().toISOString()
          });
          logger.log('Successfully cached transcript in video document');
        } catch (cachingError) {
          logger.error('Error caching transcript in video document:', cachingError);
        }
      }

      return segments;
    } catch (youtubeError) {
      logger.error('Error fetching from YouTube:', youtubeError);
      return [];
    }
  } catch (error) {
    logger.error('Error fetching transcript:', error);
    return [];
  }
}

function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g;

  let match;
  while ((match = regex.exec(xml)) !== null) {
    const [_, start, duration, text] = match;
    segments.push({
      text: text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]*>/g, '')
        .trim(),
      start: Number(start),
      duration: Number(duration)
    });
  }

  return segments;
}
