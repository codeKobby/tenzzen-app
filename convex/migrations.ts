import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { TranscriptDoc } from "./schema";

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
export const migrateTranscriptsToVideos = mutation({
  args: {},
  handler: async (ctx) => {
    // Fetch all existing transcripts
    const transcripts = await ctx.db.query("transcripts").collect();
    
    console.log(`Found ${transcripts.length} transcripts to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;

    // Process each transcript
    for (const transcript of transcripts) {
      try {
        // Find the corresponding video
        const video = await ctx.db
          .query("videos")
          .filter(q => q.eq(q.field("youtubeId"), transcript.youtubeId))
          .first();

        if (video) {
          // If video exists, add transcript to it
          const existingTranscripts = video.transcripts || [];
          
          // Check if this language transcript already exists
          const hasTranscript = existingTranscripts.some(
            (t: any) => t.language === transcript.language
          );
          
          if (!hasTranscript) {
            // Add transcript to video document
            await ctx.db.patch(video._id, {
              transcripts: [
                ...existingTranscripts,
                {
                  language: transcript.language,
                  segments: transcript.segments,
                  cachedAt: transcript.cachedAt
                }
              ]
            });
            migratedCount++;
          }
        } else {
          // If video doesn't exist, create a placeholder video with the transcript
          await ctx.db.insert("videos", {
            youtubeId: transcript.youtubeId,
            details: {
              type: "video",
              id: transcript.youtubeId,
              title: "Placeholder Title",
              description: "",
              duration: "",
              thumbnail: ""
            },
            transcripts: [{
              language: transcript.language,
              segments: transcript.segments,
              cachedAt: transcript.cachedAt
            }],
            cachedAt: transcript.cachedAt
          });
          migratedCount++;
        }
      } catch (error) {
        console.error(`Error migrating transcript for video ${transcript.youtubeId}:`, error);
        errorCount++;
      }
    }

    return {
      totalTranscripts: transcripts.length,
      migratedCount,
      errorCount
    };
  }
});

// Optional cleanup to remove the old transcript documents after migration
export const deleteOldTranscripts = mutation({
  args: {},
  handler: async (ctx) => {
    const transcripts = await ctx.db.query("transcripts").collect();
    
    console.log(`Removing ${transcripts.length} old transcript documents`);
    
    let deletedCount = 0;
    
    for (const transcript of transcripts) {
      await ctx.db.delete(transcript._id);
      deletedCount++;
    }
    
    return {
      deletedCount
    };
  }
});