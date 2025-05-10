import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { VideoDoc, TranscriptSegment } from "./schema";
import { Migration } from "./migration_framework";
import { fixUserStatsFieldNames } from "./migrations/fix_user_stats_field_names";
import { fixUserTimestamps } from "./migrations/fix_user_timestamps";

// Define migration metadata
export const migrations: Migration[] = [
  {
    id: "fix-playlist-video-records",
    name: "Fix Playlist Video Records",
    description: "Fix playlist_videos records with string playlistIds instead of references",
    version: 1,
    apply: async (ctx) => {
      // Implementation in fixPlaylistVideoRecords mutation
      return await ctx.runMutation("migrations:fixPlaylistVideoRecords", {});
    }
  },
  {
    id: "migrate-transcripts-to-videos",
    name: "Migrate Transcripts to Videos",
    description: "Move transcripts from dedicated table to video documents",
    version: 2,
    runAfter: ["fix-playlist-video-records"],
    apply: async (ctx) => {
      // Implementation in migrateTranscriptsToVideos mutation
      return await ctx.runMutation("migrations:migrateTranscriptsToVideos", {});
    }
  },
  {
    id: "add-missing-enrollment-indexes",
    name: "Add Missing Enrollment Indexes",
    description: "Verify and add missing indexes for enrollment queries",
    version: 3,
    runAfter: ["migrate-transcripts-to-videos"],
    apply: async (ctx) => {
      // No actual implementation needed - schema updates handle this
      // This is a placeholder for tracking schema changes as migrations
      return {
        success: true,
        message: "Indexes added in schema.ts update",
        schemaChange: true
      };
    }
  },
  {
    id: "add-validation-rules",
    name: "Add Database Validation Rules",
    description: "Implement stricter validation rules for database fields",
    version: 4,
    runAfter: ["add-missing-enrollment-indexes"],
    apply: async (ctx) => {
      // No actual implementation needed - schema updates handle this
      return {
        success: true,
        message: "Validation rules added in schema.ts and validation.ts",
        schemaChange: true
      };
    }
  },
  {
    id: "fix-user-stats-field-names",
    name: "Fix User Stats Field Names",
    description: "Convert snake_case field names to camelCase field names in user_stats records",
    version: 5,
    runAfter: ["add-validation-rules"],
    apply: async (ctx) => {
      // Implementation in fixUserStatsFieldNames mutation
      return await ctx.runMutation("migrations:fixUserStatsFieldNames", {});
    }
  },
  {
    id: "fix-user-timestamps",
    name: "Fix User Timestamps",
    description: "Add missing createdAt and updatedAt fields to user records",
    version: 6,
    runAfter: ["fix-user-stats-field-names"],
    apply: async (ctx) => {
      // Implementation in fixUserTimestamps mutation
      return await ctx.runMutation("migrations:fixUserTimestamps", {});
    }
  }
];

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

// Export the fixUserStatsFieldNames mutation
export { fixUserStatsFieldNames };

// Export the fixUserTimestamps mutation
export { fixUserTimestamps };