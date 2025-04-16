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
    'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
  cache: 'no-store' as const
  };
}
