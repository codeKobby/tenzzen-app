const CACHE_TTL_MS = parseInt(process.env.TRANSCRIPT_CACHE_TTL_MS || "900000", 10);

interface TranscriptSegmentLike {
  text: string;
  duration?: number;
  offset?: number;
  start?: number;
}

interface CacheEntry {
  videoId: string;
  segments: TranscriptSegmentLike[];
  transcriptText: string;
  cachedAt: number;
}

interface GlobalTranscriptCache {
  __tenzzenTranscriptCache?: Map<string, CacheEntry>;
}

const getGlobalCache = (): Map<string, CacheEntry> => {
  const globalScope = globalThis as GlobalTranscriptCache;
  if (!globalScope.__tenzzenTranscriptCache) {
    globalScope.__tenzzenTranscriptCache = new Map();
  }
  return globalScope.__tenzzenTranscriptCache;
};

export const getCachedTranscript = (videoId: string): CacheEntry | null => {
  const cache = getGlobalCache();
  if (!cache.has(videoId)) {
    return null;
  }

  const entry = cache.get(videoId)!;
  const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;
  if (isExpired) {
    cache.delete(videoId);
    return null;
  }

  return entry;
};

export const setCachedTranscript = (
  videoId: string,
  segments: TranscriptSegmentLike[],
  transcriptText: string
) => {
  const cache = getGlobalCache();
  cache.set(videoId, {
    videoId,
    segments,
    transcriptText,
    cachedAt: Date.now(),
  });
};

export type { TranscriptSegmentLike };
