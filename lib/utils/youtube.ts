'use client';

export function identifyYoutubeIdType(id: string): 'video' | 'playlist' | 'unknown' {
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

export function formatViews(viewCount: string | undefined): string {
  if (!viewCount) return "0";
  const views = parseInt(viewCount);
  if (isNaN(views)) return "0";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return viewCount;
}

export const safeGet = (obj: any, path: string, defaultValue: any = undefined) => {
  try {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    return current === undefined ? defaultValue : current;
  } catch (e) {
    return defaultValue;
  }
};

// Server options for YouTube API requests
export const fetchOptions = {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Tenzzen/1.0',
    'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
  cache: 'no-store' as const
};
