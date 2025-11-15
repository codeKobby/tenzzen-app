'use server';

import { unstable_noStore } from "next/cache";
import { Innertube } from 'youtubei.js';

export interface TranscriptSegment {
  text: string
  duration: number
  offset: number
}

// Modern YouTube transcript fetching using youtubei.js
export async function getYoutubeTranscript(
  videoId: string,
  language?: string
): Promise<TranscriptSegment[]> {
  'use server'; // Ensure this runs on the server

  unstable_noStore(); // Prevent caching

  console.log(`Fetching transcript for video: ${videoId} using youtubei.js`);

  try {
    // Initialize YouTube client
    const youtube = await Innertube.create({
      lang: language || 'en',
      location: 'US'
    });

    // Get video info
    const info = await youtube.getInfo(videoId);

    // Check if captions are available
    if (!info.captions) {
      throw new Error('No captions available for this video');
    }

    // Get available caption tracks
    const captionTracks = info.captions.caption_tracks;

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No caption tracks found');
    }

    // Find the best caption track
    let selectedTrack = captionTracks[0]; // Default to first track

    if (language) {
      // Try to find exact language match
      const langTrack = captionTracks.find(track =>
        track.language_code?.toLowerCase() === language.toLowerCase() ||
        track.name?.text?.toLowerCase().includes(language.toLowerCase())
      );

      if (langTrack) {
        selectedTrack = langTrack;
      }
    } else {
      // Prefer English or auto-generated English
      const engTrack = captionTracks.find(track =>
        track.language_code === 'en' ||
        track.language_code === 'en-US' ||
        track.name?.text?.toLowerCase().includes('english')
      );

      if (engTrack) {
        selectedTrack = engTrack;
      }
    }

    console.log(`Selected caption track: ${selectedTrack.name?.text || 'Unknown'} (${selectedTrack.language_code})`);

    // Get the transcript using the info object (correct method)
    const transcriptInfo = await info.getTranscript();

    // Access the transcript content from the TranscriptInfo object
    const transcriptData = transcriptInfo.transcript?.content?.body?.initial_segments || [];

    // Convert to our format
    const segments: TranscriptSegment[] = transcriptData.map((item: any) => ({
      text: item.snippet?.text || '',
      duration: parseFloat(item.end_ms) / 1000 - parseFloat(item.start_ms) / 1000 || 0,
      offset: parseFloat(item.start_ms) / 1000 || 0
    }));

    if (segments.length === 0) {
      throw new Error('No transcript segments found');
    }

    console.log(`Successfully fetched ${segments.length} transcript segments using youtubei.js`);

    return segments;

  } catch (error) {
    console.error('Error fetching transcript with youtubei.js:', error);

    // Fallback to the original method if youtubei.js fails
    console.log('Falling back to original transcript fetching method...');

    try {
      return await getYoutubeTranscriptFallback(videoId, language);
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      throw error instanceof Error
        ? error
        : new Error('Unknown error while fetching transcript');
    }
  }
}

// Fallback method using direct YouTube API calls
async function getYoutubeTranscriptFallback(
  videoId: string,
  language?: string
): Promise<TranscriptSegment[]> {
  console.log(`Fetching transcript for video: ${videoId} using fallback method`);

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
    let match = html.match(captionTrackRegex);

    if (!match || !match[1]) {
      // Fallback to a simpler pattern if the first one fails
      const simpleCaptionRegex = /"captionTracks":\s*(\[.*?\])/s;
      const simpleMatch = html.match(simpleCaptionRegex);

      if (!simpleMatch || !simpleMatch[1]) {
        throw new Error('No captions found in this video');
      }

      match = simpleMatch;
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

    // Debug: Log a sample of the XML to understand the format
    console.log('Transcript XML sample:', transcriptXML.substring(0, 500));

    // Try multiple regex patterns for better compatibility
    const regexPatterns = [
      // Standard YouTube format
      /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g,
      // Alternative format
      /<text[^>]*start="([\d.]+)"[^>]*dur="([\d.]+)"[^>]*>(.*?)<\/text>/g,
      // Simple format
      /<text start="([\d.]+)" dur="([\d.]+)">(.*?)<\/text>/g,
      // Format with additional attributes
      /<text[^>]*start="([\d.]+)"[^>]*dur="([\d.]+)"[^>]*>(.*?)<\/text>/g
    ];

    let foundSegments = false;

    for (const regex of regexPatterns) {
      let match2;
      regex.lastIndex = 0; // Reset regex state

      while ((match2 = regex.exec(transcriptXML)) !== null) {
        const [_, startStr, durStr, text] = match2;

        // Parse start and duration as float
        const start = parseFloat(startStr);
        const dur = parseFloat(durStr);

        // Skip invalid entries
        if (isNaN(start) || isNaN(dur) || !text || text.trim().length === 0) {
          continue;
        }

        // Decode HTML entities and clean text
        const decodedText = text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/<[^>]*>/g, '') // Remove any HTML tags
          .trim();

        if (decodedText.length > 0) {
          segments.push({
            text: decodedText,
            duration: dur,
            offset: start
          });
        }
      }

      if (segments.length > 0) {
        foundSegments = true;
        console.log(`Found ${segments.length} segments with regex pattern`);
        break; // Found segments with this regex, no need to try others
      }
    }

    // If no segments found, try a more basic approach
    if (segments.length === 0) {
      console.log('Trying fallback parsing...');

      // Split by text tags and parse manually
      const textTagRegex = /<text[^>]*>(.*?)<\/text>/g;
      let match;
      let index = 0;

      while ((match = textTagRegex.exec(transcriptXML)) !== null) {
        const text = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .trim();

        if (text.length > 0) {
          segments.push({
            text: text,
            duration: 1.0, // Default duration
            offset: index * 2.0 // Estimate timing
          });
          index++;
        }
      }
    }

    if (segments.length === 0) {
      console.error('Transcript XML structure:', transcriptXML.substring(0, 1000));
      throw new Error('Failed to parse transcript data - no valid segments found');
    }

    console.log(`Successfully parsed ${segments.length} transcript segments with fallback method`);

    return segments;

  } catch (error) {
    console.error('Error in fallback transcript fetching:', error);
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
}
