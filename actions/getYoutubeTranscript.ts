'use server';

import { Innertube } from 'youtubei.js';
import { createLogger } from "@/lib/debug-logger";
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Define the TranscriptSegment type directly in this file to avoid import issues
interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Initialize logger
const logger = createLogger("youtube-transcript");

export async function getYoutubeTranscript(
  videoId: string,
  language: string = "en"
): Promise<TranscriptSegment[]> {
  try {
    // Check if transcript is already cached in Supabase
    logger.log('Checking for cached transcript in Supabase');
    const supabase = await createServerSupabaseClient();

    try {
      const { data: cachedTranscript, error } = await supabase
        .from('video_transcripts')
        .select('segments')
        .eq('video_id', videoId)
        .eq('language', language)
        .single();

      if (!error && cachedTranscript && cachedTranscript.segments) {
        logger.log('Found valid cached transcript in Supabase');
        return cachedTranscript.segments;
      }
    } catch (cacheError) {
      logger.warn('Error retrieving transcript from Supabase:', cacheError);
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

      // Cache the transcript in Supabase
      if (segments.length > 0) {
        try {
          logger.log('Caching transcript in Supabase');

          // Cache in video_transcripts table
          const { error: transcriptError } = await supabase
            .from('video_transcripts')
            .upsert({
              video_id: videoId,
              language: language,
              segments: segments,
              cached_at: new Date().toISOString()
            });

          if (transcriptError) {
            logger.error('Error caching transcript in video_transcripts:', transcriptError);
          } else {
            logger.log('Successfully cached transcript in video_transcripts');
          }

          // Also update the videos table with the full transcript text
          const fullTranscript = segments.map(segment => segment.text).join(' ');

          // Check if video exists in videos table
          const { data: existingVideo, error: queryError } = await supabase
            .from('videos')
            .select('id')
            .eq('video_id', videoId)
            .limit(1);

          if (queryError) {
            logger.error('Error checking for video in videos table:', queryError);
          } else if (existingVideo && existingVideo.length > 0) {
            // Update existing video with transcript
            const { error: updateError } = await supabase
              .from('videos')
              .update({
                transcript: fullTranscript,
                updated_at: new Date().toISOString()
              })
              .eq('video_id', videoId);

            if (updateError) {
              logger.error('Error updating transcript in videos table:', updateError);
            } else {
              logger.log('Successfully updated transcript in videos table');
            }
          } else {
            logger.log('Video not found in videos table, transcript will be added when video is cached');
          }
        } catch (cachingError) {
          logger.error('Error caching transcript in Supabase:', cachingError);
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
