'use server';

<<<<<<< HEAD
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
=======
import { unstable_noStore } from "next/cache";

export interface TranscriptSegment {
  text: string
  duration: number
  offset: number
}

// A more browser-friendly way to get transcripts using a direct API call
export async function getYoutubeTranscript(
  videoId: string,
  language?: string
): Promise<TranscriptSegment[]> {
  'use server'; // Ensure this runs on the server
  
  unstable_noStore(); // Prevent caching

  console.log(`Fetching transcript for video: ${videoId}`);
  
  try {
    // First, we need to get the caption track URL
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Fetch the video page
    const response = await fetch(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': language || 'en-US,en'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract caption track data
    const captionTrackRegex = /"captions":\s*{.*?"captionTracks":\s*(\[.*?\])/s;
    const match = html.match(captionTrackRegex);
    
    if (!match || !match[1]) {
      // Fallback to a simpler pattern if the first one fails
      const simpleCaptionRegex = /"captionTracks":\s*(\[.*?\])/s;
      const simpleMatch = html.match(simpleCaptionRegex);
      
      if (!simpleMatch || !simpleMatch[1]) {
        throw new Error('No captions found in this video');
      }
      
      match[1] = simpleMatch[1];
    }
    
    // Parse the caption tracks JSON
    let captionTracks: any[];
    try {
      captionTracks = JSON.parse(match[1]);
    } catch (error) {
      console.error('Failed to parse caption tracks:', error);
      throw new Error('Failed to parse caption data');
    }
    
    if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks available');
    }
    
    // Find the appropriate caption track
    let selectedTrack = captionTracks[0]; // Default to first track
    
    if (language) {
      // Try to find exact match
      const langTrack = captionTracks.find(track => 
        track.languageCode?.toLowerCase() === language.toLowerCase() ||
        track.name?.simpleText?.toLowerCase().includes(language.toLowerCase())
      );
      
      if (langTrack) {
        selectedTrack = langTrack;
      }
    } else {
      // Try to find English or auto-generated English
      const engTrack = captionTracks.find(track => 
        track.languageCode === 'en' || track.vssId === 'a.en'
      );
      
      if (engTrack) {
        selectedTrack = engTrack;
      }
    }
    
    if (!selectedTrack.baseUrl) {
      throw new Error('Selected caption track has no URL');
    }
    
    // Fetch the actual transcript XML
    const transcriptResponse = await fetch(selectedTrack.baseUrl);
    if (!transcriptResponse.ok) {
      throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
    }
    
    const transcriptXML = await transcriptResponse.text();
    
    // Parse the XML on the server
    const segments: TranscriptSegment[] = [];
    
    // Simple regex-based XML parsing (more robust than full XML parsing for this case)
    const regex = /<text start="([\d.]+)" dur="([\d.]+)".*?>(.*?)<\/text>/g;
    let match2;
    
    while ((match2 = regex.exec(transcriptXML)) !== null) {
      const [_, startStr, durStr, text] = match2;
      
      // Parse start and duration as float
      const start = parseFloat(startStr);
      const dur = parseFloat(durStr);
      
      // Decode HTML entities
      const decodedText = text
>>>>>>> master
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
<<<<<<< HEAD
        .replace(/<[^>]*>/g, '')
        .trim(),
      start: Number(start),
      duration: Number(duration)
    });
  }

  return segments;
=======
        .replace(/<[^>]*>/g, ''); // Remove any HTML tags
      
      segments.push({
        text: decodedText,
        duration: dur,
        offset: start
      });
    }
    
    if (segments.length === 0) {
      throw new Error('Failed to parse transcript data');
    }
    
    return segments;
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error while fetching transcript');
  }
}

// Helper functions in a client-safe format (not server actions)
// Remove the export to keep them private to this file
function formatTranscriptTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Export client-safe wrapper functions
export async function formatTime(seconds: number): Promise<string> {
  'use server';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function findSegment(
  transcript: TranscriptSegment[],
  timeInSeconds: number
): Promise<TranscriptSegment | undefined> {
  'use server';
  return transcript.find(segment => {
    const start = segment.offset;
    const end = start + segment.duration;
    return timeInSeconds >= start && timeInSeconds < end;
  });
}

export async function getSegmentRange(
  transcript: TranscriptSegment[],
  startTime: number,
  endTime: number
): Promise<TranscriptSegment[]> {
  'use server';
  return transcript.filter(segment => {
    const segmentStart = segment.offset;
    const segmentEnd = segmentStart + segment.duration;
    return (segmentStart >= startTime && segmentStart < endTime) ||
           (segmentEnd > startTime && segmentEnd <= endTime) ||
           (segmentStart <= startTime && segmentEnd >= endTime);
  });
}

export async function searchInTranscript(
  transcript: TranscriptSegment[],
  query: string,
  fuzzy = false
): Promise<TranscriptSegment[]> {
  'use server';
  const searchTerm = query.toLowerCase();
  
  if (fuzzy) {
    // Fuzzy search implementation
    return transcript.filter(segment => {
      const words = searchTerm.split(' ');
      const text = segment.text.toLowerCase();
      return words.every(word => text.includes(word));
    });
  }
  
  // Exact match search
  return transcript.filter(segment => 
    segment.text.toLowerCase().includes(searchTerm)
  );
>>>>>>> master
}
