'use server';

export async function identifyYoutubeIdType(id: string): Promise<'video' | 'playlist' | 'unknown'> {
  if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return 'video';
  }
  if (/^(PL|FL|UU|LL|RD|OL|TL|UL|OLAK5uy_)[A-Za-z0-9_-]{10,}$/.test(id)) {
    return 'playlist';
  }
  if (id.length > 11) {
    return 'playlist';
  }
  return 'unknown';
}

// Server options for YouTube API requests
export async function getFetchOptions() {
  return {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Tenzzen/1.0',
      // Always use localhost:3000 as Origin and Referer to work with current API key configuration
      'Origin': 'http://localhost:3000',
      'Referer': 'http://localhost:3000'
    },
    cache: 'no-store' as const,
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(10000) // 10 second timeout
  };
}
