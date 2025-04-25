import { QueryCtx } from "./_generated/server"
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
