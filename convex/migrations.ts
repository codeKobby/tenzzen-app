import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { VideoDoc, TranscriptSegment } from "./schema";

// Migration to fix playlist_videos records with string playlistIds
export const fixPlaylistVideoRecords = mutation({
  args: {},
  handler: async (ctx) => {
    // Find all playlist_videos records
    const records = await ctx.db.query("playlist_videos").collect();
    let fixed = 0;
    let errors = 0;
    
    for (const record of records) {
      // Check if playlistId is a string (invalid)
      if (typeof record.playlistId === 'string') {
        try {
          // Try to find the playlist by YouTube ID
          const playlist = await ctx.db
            .query("playlists")
            .withIndex("by_youtube_id", q => q.eq("youtubeId", record.playlistId))
            .unique();
            
          if (playlist) {
            // Update the record with the correct ID
            await ctx.db.patch(record._id, {
              playlistId: playlist._id
            });
            fixed++;
          } else {
            // Create a new playlist record
            const newPlaylistId = await ctx.db.insert("playlists", {
              youtubeId: record.playlistId,
              title: "Auto-created Playlist",
              description: "Created during migration",
              thumbnail: "",
              itemCount: 0,
              cachedAt: new Date().toISOString()
            });
            
            // Update the record with the new playlist ID
            await ctx.db.patch(record._id, {
              playlistId: newPlaylistId
            });
            fixed++;
          }
        } catch (error) {
          errors++;
          console.error(`Error fixing record ${record._id}:`, error);
        }
      }
    }
    
    return {
      processed: records.length,
      fixed,
      errors
    };
  }
});

// Migrate transcripts to be stored within video documents
// Note: This migration is for legacy data only - the transcripts table has been removed
export const migrateTranscriptsToVideos = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("This migration is now obsolete as the transcripts table has been removed.");
    console.log("Transcripts are now stored directly in the videos table.");
    
    return {
      status: "obsolete",
      message: "Transcripts table has been removed. Transcripts are now stored in the videos table."
    };
  }
});

// Optional cleanup to remove the old transcript documents after migration
// Note: This is now obsolete as the transcripts table has been removed
export const deleteOldTranscripts = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("This migration is now obsolete as the transcripts table has been removed.");
    
    return {
      status: "obsolete",
      message: "Transcripts table has been removed."
    };
  }
});