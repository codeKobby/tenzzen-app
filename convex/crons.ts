import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Schedule cleanup jobs to run every hour
// This will clean up any cached data older than 1 hour
crons.hourly(
  "cleanup-transcripts", 
  { minuteUTC: 0 },  // Run at minute 0
  api.transcripts.clearOldTranscripts
);

crons.hourly(
  "cleanup-videos", 
  { minuteUTC: 0 },  // Run at minute 0
  api.videos.clearOldVideos
);

export default crons;
