/**
 * Identifies whether a YouTube ID or URL corresponds to a video or playlist
 * @param input The YouTube ID or URL to check
 * @returns Object containing the type and extracted ID
 */
export async function identifyYoutubeIdType(input: string): Promise<{ type: 'video' | 'playlist' | 'unknown'; id: string | null }> {
  // Try to extract ID from URL if input is a URL
  try {
    const url = new URL(input);
    
    // Handle youtube.com URLs
    if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com') {
      // Video
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        if (videoId) return { type: 'video', id: videoId };
      }
      
      // Playlist
      if (url.pathname === '/playlist') {
        const playlistId = url.searchParams.get('list');
        if (playlistId) return { type: 'playlist', id: playlistId };
      }
      
      // Embedded video
      if (url.pathname.startsWith('/embed/')) {
        const videoId = url.pathname.split('/')[2];
        if (videoId) return { type: 'video', id: videoId };
      }
    }
    
    // Handle youtu.be short URLs
    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.substring(1);
      if (videoId) return { type: 'video', id: videoId };
    }
  } catch (e) {
    // Not a URL, might be just an ID
  }
  
  // Standard YouTube video IDs are 11 characters
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
    return { type: 'video', id: input };
  }
  
  // YouTube playlist IDs typically start with these prefixes
  if (/^(PL|FL|UU|LL|RD|OL|TL|UL|OLAK5uy_)[A-Za-z0-9_-]{10,}$/.test(input)) {
    return { type: 'playlist', id: input };
  }
  
  // Unknown or invalid ID
  return { type: 'unknown', id: null };
}

// Keep other useful utility functions
export function extractVideoId(url: string): string | null {
  try {
    // Handle various YouTube URL formats
    if (url.includes('youtu.be/')) {
      // Short youtu.be links
      const parts = url.split('youtu.be/');
      if (parts.length > 1) {
        return parts[1].split('?')[0].split('&')[0].split('#')[0];
      }
    } else if (url.includes('youtube.com/watch')) {
      // Standard watch URLs
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    } else if (url.includes('youtube.com/embed/')) {
      // Embedded player URLs
      const parts = url.split('youtube.com/embed/');
      if (parts.length > 1) {
        return parts[1].split('?')[0].split('&')[0].split('#')[0];
      }
    } else if (url.includes('youtube.com/v/')) {
      // Legacy v parameter URLs
      const parts = url.split('youtube.com/v/');
      if (parts.length > 1) {
        return parts[1].split('?')[0].split('&')[0].split('#')[0];
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}