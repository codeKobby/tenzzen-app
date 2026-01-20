import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled Background Jobs
 *
 * Implements periodic maintenance tasks for system health:
 * - Cleanup stale notifications
 * - Recalculate trending scores
 * - Process pending generation jobs
 * - Clean up old generation jobs
 */

const crons = cronJobs();

// Daily: Clean up old notifications (older than 30 days)
crons.daily(
  "cleanup-old-notifications",
  { hourUTC: 3, minuteUTC: 0 }, // 3:00 AM UTC
  internal.cronTasks.cleanupOldNotifications,
);

// Weekly: Recalculate trending scores for courses
crons.weekly(
  "recalculate-trending",
  { dayOfWeek: "monday", hourUTC: 5, minuteUTC: 0 }, // Monday 5:00 AM UTC
  internal.cronTasks.recalculateTrendingScores,
);

// Every 5 minutes: Process pending generation jobs
crons.interval(
  "process-generation-jobs",
  { minutes: 5 },
  internal.cronTasks.processPendingJobs,
);

// Daily: Clean up completed/failed generation jobs older than 7 days
crons.daily(
  "cleanup-old-jobs",
  { hourUTC: 4, minuteUTC: 0 }, // 4:00 AM UTC
  internal.cronTasks.cleanupOldJobs,
);

export default crons;
