import { QueryCtx, MutationCtx } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import type { DbVideo, DbPlaylist, DbPlaylistVideo } from "./youtubeTypes"

// Helper to check if video exists in cache
export async function checkVideoCache(
  ctx: QueryCtx,
  videoId: string
): Promise<DbVideo | null> {
  return await ctx.db
    .query("videos")
    .withIndex("by_youtube_id", (q) => q.eq("youtubeId", videoId))
    .unique()
}

// Helper to check if playlist exists in cache by YouTube playlist ID
export async function checkPlaylistCache(
  ctx: QueryCtx,
  youtubePlaylistId: string
): Promise<DbPlaylist | null> {
  return await ctx.db
    .query("playlists")
    .withIndex("by_youtube_id", (q) => q.eq("youtubeId", youtubePlaylistId))
    .unique();
}

// Helper to get playlist videos by Convex playlist ID
export async function getPlaylistVideos(
  ctx: QueryCtx,
  playlistId: Id<"playlists">
): Promise<DbPlaylistVideo[]> {
  return await ctx.db
    .query("playlist_videos")
    .withIndex("by_playlist", (q) => q.eq("playlistId", playlistId))
    .collect();
}

// Helper to get playlist videos by YouTube playlist ID
export async function getPlaylistVideosByYouTubeId(
  ctx: QueryCtx,
  youtubePlaylistId: string
): Promise<DbPlaylistVideo[]> {
  const playlist = await checkPlaylistCache(ctx, youtubePlaylistId);
  if (!playlist) return [];
  return getPlaylistVideos(ctx, playlist._id as Id<"playlists">);
}

// Helper to format dates consistently
export function formatDate(date: string | Date): string {
  return new Date(date).toISOString()
}

// Helper to validate YouTube IDs
export function validateYouTubeId(id: string, type: 'video' | 'playlist'): boolean {
  if (!id) return false

  // Video IDs are 11 characters
  if (type === 'video' && id.length !== 11) return false

  // Playlist IDs typically start with PL, UU, or similar
  if (type === 'playlist' && id.length < 12) return false

  return true
}

// User-related helper functions

// Helper to get or create a user record
export async function getOrCreateUser(
  ctx: MutationCtx,
  clerkId: string,
  userData: {
    email: string;
    name: string;
    imageUrl?: string;
  }
): Promise<Id<"users">> {
  // Check if user already exists
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .unique();

  if (existingUser) {
    const now = Date.now();
    const updates: Record<string, any> = {};
    let needsUpdate = false;

    // Check if user data has changed
    if (
      existingUser.email !== userData.email ||
      existingUser.name !== userData.name ||
      existingUser.imageUrl !== userData.imageUrl
    ) {
      updates.email = userData.email;
      updates.name = userData.name;
      updates.imageUrl = userData.imageUrl;
      needsUpdate = true;
    }

    // Check if createdAt or updatedAt fields are missing
    if (!('createdAt' in existingUser)) {
      updates.createdAt = now;
      needsUpdate = true;
    }

    if (!('updatedAt' in existingUser)) {
      updates.updatedAt = now;
      needsUpdate = true;
    } else {
      // Always update the updatedAt field if other fields have changed
      if (needsUpdate) {
        updates.updatedAt = now;
      }
    }

    // Update the user record if needed
    if (needsUpdate) {
      await ctx.db.patch(existingUser._id, updates);
    }

    return existingUser._id;
  }

  // Create new user if doesn't exist
  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    clerkId,
    email: userData.email,
    name: userData.name,
    imageUrl: userData.imageUrl,
    authProvider: "clerk",
    role: "user",
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastLogin: {
      time: now,
    },
  });

  // Initialize user profile
  await ctx.db.insert("user_profiles", {
    userId: clerkId, // Use clerkId as userId for referencing
    updatedAt: now,
  });

  // Initialize user stats with both camelCase and snake_case field names
  await ctx.db.insert("user_stats", {
    // CamelCase fields
    userId: clerkId, // Use clerkId as userId for referencing
    totalLearningHours: 0,
    coursesCompleted: 0,
    coursesInProgress: 0,
    assessmentsCompleted: 0,
    projectsSubmitted: 0,
    lastActiveAt: now,
    streakDays: 0,
    longestStreak: 0,
    totalPoints: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0], // One value per day of week

    // Snake_case fields for backward compatibility
    user_id: clerkId,
    total_learning_hours: 0,
    courses_completed: 0,
    courses_in_progress: 0,
    assessments_completed: 0,
    projects_submitted: 0,
    last_active_at: now,
    streak_days: 0,
    longest_streak: 0,
    total_points: 0,
    weekly_activity: [0, 0, 0, 0, 0, 0, 0]
  });

  return userId;
}

// Helper to get user data with profile
export async function getUserWithProfile(
  ctx: QueryCtx,
  userId: string
): Promise<{
  user: any;
  profile: any;
  stats: any;
} | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
    .unique();

  if (!user) return null;

  const profile = await ctx.db
    .query("user_profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();

  const stats = await ctx.db
    .query("user_stats")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  return {
    user,
    profile: profile || null,
    stats: stats || null,
  };
}

// Helper to update user login time
export async function updateUserLogin(
  ctx: MutationCtx,
  clerkId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .unique();

  if (user) {
    const now = Date.now();
    const updates: Record<string, any> = {
      lastLogin: {
        time: now,
        ip: ipAddress,
        userAgent: userAgent,
      },
    };

    // Check if createdAt or updatedAt fields are missing
    if (!('createdAt' in user)) {
      updates.createdAt = now;
    }

    if (!('updatedAt' in user)) {
      updates.updatedAt = now;
    } else {
      // Always update the updatedAt field
      updates.updatedAt = now;
    }

    await ctx.db.patch(user._id, updates);
  }
}

// Helper to update user preferences
export async function updateUserPreferences(
  ctx: MutationCtx,
  userId: string,
  preferences: any
): Promise<void> {
  const profile = await ctx.db
    .query("user_profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();

  if (profile) {
    await ctx.db.patch(profile._id, {
      preferences: preferences,
      updatedAt: Date.now(),
    });
  }
}

// Helper to update learning preferences
export async function updateLearningPreferences(
  ctx: MutationCtx,
  userId: string,
  learningPreferences: any
): Promise<void> {
  const profile = await ctx.db
    .query("user_profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();

  if (profile) {
    await ctx.db.patch(profile._id, {
      learningPreferences: learningPreferences,
      updatedAt: Date.now(),
    });
  }
}
