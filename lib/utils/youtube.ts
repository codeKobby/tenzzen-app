/**
 * Identifies whether a YouTube ID corresponds to a video or playlist
 * @param id The YouTube ID to check
 * @returns 'video', 'playlist', or 'unknown'
 */
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