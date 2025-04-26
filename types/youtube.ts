export interface VideoBase {
  id: string;
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
  hasTranscripts?: boolean;
}

export interface VideoDetails extends VideoBase {
  type: "video";
}

export interface PlaylistVideo extends VideoDetails {
  position: number;
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
  videos: PlaylistVideo[];
}

export type ContentDetails = VideoDetails | PlaylistDetails;
