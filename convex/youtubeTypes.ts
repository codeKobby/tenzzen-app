import { Id } from "./_generated/dataModel";

// Internal types for Convex database schema
export interface DbVideo {
  _id: Id<"videos">;
  _creationTime: number;
  youtubeId: string;
  title: string;
  description: string;
  duration: string;
  cachedAt: number;
}

export interface DbPlaylist {
  _id: Id<"playlists">;
  _creationTime: number;
  youtubeId: string;
  title: string;
  description: string;
  cachedAt: number;
}

export interface DbPlaylistVideo {
  _id: Id<"playlist_videos">;
  _creationTime: number;
  playlistId: string;
  videoId: string;
  position: number;
}

// Type guard for video documents
export function isDbVideo(doc: any): doc is DbVideo {
  return doc !== null && 
         typeof doc._id === 'object' && 
         doc._id.__tableName === 'videos' &&
         typeof doc.youtubeId === 'string' &&
         typeof doc.title === 'string';
}

// Type guard for playlist documents
export function isDbPlaylist(doc: any): doc is DbPlaylist {
  return doc !== null &&
         typeof doc._id === 'object' &&
         doc._id.__tableName === 'playlists' &&
         typeof doc.youtubeId === 'string' &&
         typeof doc.title === 'string';
}
