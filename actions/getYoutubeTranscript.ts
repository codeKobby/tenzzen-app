import { Innertube } from 'youtubei.js'

export interface TranscriptSegment {
  text: string
  duration: number
  offset: number
}

interface YouTubeCaptionTrack {
  base_url: string
  language_code: string
  name: {
    text: string
  }
  vss_id: string
}

// Helper function to format time
export const formatTranscriptTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Helper function to get text segment at specific time
export const findTranscriptSegment = (
  transcript: TranscriptSegment[],
  timeInSeconds: number
): TranscriptSegment | undefined => {
  return transcript.find(segment => {
    const start = segment.offset
    const end = start + segment.duration
    return timeInSeconds >= start && timeInSeconds < end
  })
}

// Helper to get a range of transcript segments
export const getTranscriptRange = (
  transcript: TranscriptSegment[],
  startTime: number,
  endTime: number
): TranscriptSegment[] => {
  return transcript.filter(segment => {
    const segmentStart = segment.offset
    const segmentEnd = segmentStart + segment.duration
    return (segmentStart >= startTime && segmentStart < endTime) ||
           (segmentEnd > startTime && segmentEnd <= endTime) ||
           (segmentStart <= startTime && segmentEnd >= endTime)
  })
}

// Helper to search transcript segments
export const searchTranscript = (
  transcript: TranscriptSegment[],
  query: string,
  fuzzy = false
): TranscriptSegment[] => {
  const searchTerm = query.toLowerCase()
  
  if (fuzzy) {
    // Fuzzy search implementation
    return transcript.filter(segment => {
      const words = searchTerm.split(' ')
      const text = segment.text.toLowerCase()
      return words.every(word => text.includes(word))
    })
  }
  
  // Exact match search
  return transcript.filter(segment => 
    segment.text.toLowerCase().includes(searchTerm)
  )
}

export async function getYoutubeTranscript(
  videoId: string,
  language?: string
): Promise<TranscriptSegment[]> {
  try {
    // Initialize YouTube client
    const youtube = await Innertube.create({
      generate_session_locally: true,
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
    })

    // Get video info
    const video = await youtube.getInfo(videoId)
    
    if (!video.captions) {
      throw new Error('No captions available for this video')
    }

    // Get all captions
    const tracks = video.captions.caption_tracks as YouTubeCaptionTrack[]
    if (!tracks || tracks.length === 0) {
      throw new Error('No caption tracks found')
    }

    // Select caption track based on language
    const selectedTrack = language
      ? tracks.find(track => {
          const trackLang = track.language_code?.toLowerCase()
          const trackName = track.name?.text?.toLowerCase()
          const targetLang = language.toLowerCase()
          return trackLang === targetLang || trackName === targetLang
        })
      : tracks[0]

    if (!selectedTrack) {
      throw new Error(
        language 
          ? `No captions available in language: ${language}`
          : 'No caption track available'
      )
    }

    // Use the track base URL to fetch captions
    const captionResponse = await fetch(selectedTrack.base_url)
    if (!captionResponse.ok) {
      throw new Error('Failed to fetch captions')
    }

    const captionXml = await captionResponse.text()
    const segments = parseCaptionXml(captionXml)

    return segments.map(segment => ({
      text: segment.text.trim(),
      duration: Number(segment.dur) / 1000,
      offset: Number(segment.start) / 1000
    }))

  } catch (error) {
    console.error('Error in getYoutubeTranscript:', error)
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch transcript'
    )
  }
}

// Helper to parse caption XML
const parseCaptionXml = (xml: string): Array<{text: string; dur: string; start: string}> => {
  if (typeof window === 'undefined') {
    throw new Error('This function requires a browser environment')
  }

  const segments: Array<{text: string; dur: string; start: string}> = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const textNodes = doc.getElementsByTagName('text')

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i]
    segments.push({
      text: node.textContent || '',
      dur: node.getAttribute('dur') || '0',
      start: node.getAttribute('start') || '0'
    })
  }

  return segments
}
