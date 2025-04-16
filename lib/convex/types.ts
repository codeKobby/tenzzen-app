// Generated Id type since we can't import from Convex
type Id<T extends string> = { id: string; tableName: T };

interface VideoData {
  id: string;
  type: 'video';
  duration: string;
  title: string;
  description: string;
  thumbnail: string;
}

export interface CachedVideo {
  _id: Id<"videos">;
  _creationTime: number;
  youtubeId: string;
  cachedAt: string;
  details: VideoData;
}

export interface ExpiredVideo {
  _id: Id<"videos">;
  youtubeId: string;
  expired: boolean;
}

export interface CacheMutationInput {
  youtubeId: string;
  cachedAt: string;
  details: VideoData;
}

export type CacheResponse = CachedVideo | ExpiredVideo;
