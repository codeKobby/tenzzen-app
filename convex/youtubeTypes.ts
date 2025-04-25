import { Id } from "./_generated/dataModel";

// Video types
export interface DbVideo {
  _id: Id<"videos">;
  _creationTime: number;
  youtubeId: string;
  details: {
    type: string;
    id: string;
    title?: string;
    description: string;
    duration: string;
    thumbnail: string;
  };
  cachedAt: string;
}

// Playlist types
export interface DbPlaylist {
  _id: Id<"playlists">;
  _creationTime: number;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  itemCount: number;
  cachedAt: string;
}

// Playlist video relationship
export interface DbPlaylistVideo {
  _id: Id<"playlist_videos">;
  _creationTime: number;
  playlistId: Id<"playlists">;
  videoId: Id<"videos">;
  position: number;
}

// Assessment types
export interface DbAssessment {
  _id: Id<"assessments">;
  _creationTime: number;
  title: string;
  description: string;
  courseId: Id<"courses">;
  type: string; // "quiz", "project", etc.
  questions?: any[];
  instructions?: string;
  createdAt: number;
}

// Progress tracking
export interface DbProgress {
  _id: Id<"progress">;
  _creationTime: number;
  userId: string;
  assessmentId: Id<"assessments">;
  status: "not_started" | "in_progress" | "completed" | "graded";
  score?: number;
  feedback?: string;
  submission?: any;
  startedAt?: number;
  completedAt?: number;
}