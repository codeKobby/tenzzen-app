export interface VideoItem {
  id: string;
  type: "video";
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  channelId: string;
  channelName: string;
  channelAvatar?: string;
  views: string;
  likes: string;
  publishDate: string;
  videoId?: string;
}

export interface VideoDetails extends VideoItem {
  type: "video";
  thumbnails?: {
    default?: { url: string };
    high?: { url: string };
  };
}

export interface PlaylistDetails {
  id: string;
  type: "playlist";
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  channelAvatar?: string;
  itemCount: number;
  videos: VideoDetails[];
  thumbnails?: {
    default?: { url: string };
    high?: { url: string };
  };
}

export type ContentDetails = VideoDetails | PlaylistDetails;

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface SearchResult {
  id: {
    kind: string;
    videoId?: string;
    playlistId?: string;
    channelId?: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    publishTime: string;
  };
}
