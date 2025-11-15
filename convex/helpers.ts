import { QueryCtx } from "./_generated/server"
import type { DbVideo, DbPlaylist, DbPlaylistVideo } from "./youtubeTypes"

// Helper to get authenticated user ID
export async function getUserId(ctx: QueryCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

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

// Helper to check if playlist exists in cache
export async function checkPlaylistCache(
  ctx: QueryCtx,
  playlistId: string
): Promise<(DbPlaylist & { videos?: DbPlaylistVideo[] }) | null> {
  return await ctx.db
    .query("playlists")
    .withIndex("by_youtube_id", (q) => q.eq("youtubeId", playlistId))
    .unique()
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
