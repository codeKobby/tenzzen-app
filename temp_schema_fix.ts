// Export type for video document
export interface VideoDoc {
  _id: string;
  _creationTime: number;
  youtubeId: string;
  details: {
    type: string;
    id: string,
    title?: string; // Made optional to match schema
    description: string;
    duration: string; // ISO 8601 duration
    thumbnail: string;
    // Add corresponding types for new fields
    channelId?: string;
    channelName?: string;
    channelAvatar?: string;
    views?: string;
    likes?: string;
    publishDate?: string;
  };
  transcripts?: {
    language: string;
    segments: TranscriptSegment[];
    cachedAt: string;
  }[];
  cachedAt: string;
  // Add courseData field to match schema update
  courseData?: any;
  // Add expired flag for cache expiration state
  expired?: boolean;
}
