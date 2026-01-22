import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getUserId } from "./helpers";
import { Innertube } from "youtubei.js";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// List all user materials
export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];

    let materials;

    if (args.category) {
      materials = await ctx.db
        .query("user_materials")
        .withIndex("by_user_category", (q) =>
          q.eq("userId", userId).eq("category", args.category!),
        )
        .order("desc")
        .take(args.limit || 50);
    } else {
      materials = await ctx.db
        .query("user_materials")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(args.limit || 50);
    }

    return materials;
  },
});

// Get recent materials for dashboard widget
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];

    const materials = await ctx.db
      .query("user_materials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 5);

    return materials;
  },
});

// Get a single material by ID
export const get = query({
  args: {
    id: v.id("user_materials"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;

    const material = await ctx.db.get(args.id);
    if (!material || material.userId !== userId) {
      return null;
    }

    return material;
  },
});

// Create a new user material
export const create = mutation({
  args: {
    title: v.string(),
    fileType: v.union(
      v.literal("pdf"),
      v.literal("doc"),
      v.literal("txt"),
      v.literal("url"),
    ),
    fileUrl: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    extractedText: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = new Date().toISOString();

    const materialId = await ctx.db.insert("user_materials", {
      userId,
      title: args.title,
      fileType: args.fileType,
      fileUrl: args.fileUrl,
      sourceUrl: args.sourceUrl,
      extractedText: args.extractedText,
      topics: args.topics,
      summary: args.summary,
      category: args.category,
      tags: args.tags,
      studyCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Schedule background job to find related videos
    await ctx.scheduler.runAfter(
      0,
      internal.materials.generateRecommendations,
      {
        materialId,
        query: args.title + (args.tags ? " " + args.tags.join(" ") : ""),
      },
    );

    return materialId;
  },
});

// Internal mutation to save recommendations
export const saveRecommendations = internalMutation({
  args: {
    materialId: v.id("user_materials"),
    videos: v.array(
      v.object({
        youtubeId: v.string(),
        title: v.string(),
        thumbnail: v.optional(v.string()),
        relevanceScore: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.materialId, {
      recommendedVideos: args.videos,
    });
  },
});

// Internal action to search YouTube for related videos
export const generateRecommendations = internalAction({
  args: {
    materialId: v.id("user_materials"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Initialize InnerTube
      const youtube = await Innertube.create();

      // Search for videos
      const searchResults = await youtube.search(args.query);

      if (!searchResults.videos) {
        console.log("No videos found for query:", args.query);
        return;
      }

      // Process and filter results
      const videos = searchResults.videos.slice(0, 5).map((video: any) => ({
        youtubeId: video.id,
        title: video.title.text || video.title,
        thumbnail: video.thumbnails?.[0]?.url,
        relevanceScore: 0.9, // Default high relevance since it's a direct search
      }));

      // Save results
      await ctx.runMutation(internal.materials.saveRecommendations, {
        materialId: args.materialId,
        videos,
      });
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    }
  },
});

// Internal mutation to save audio script
export const saveAudioScript = internalMutation({
  args: {
    materialId: v.id("user_materials"),
    script: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.materialId, {
      audioScript: args.script,
    });
  },
});

// Action to generate podcast script using AI
export const generateAudioOverview = action({
  args: {
    materialId: v.id("user_materials"),
  },
  handler: async (ctx, args) => {
    const material = await ctx.runQuery(api.materials.get, {
      id: args.materialId,
    });
    if (!material) throw new Error("Material not found");

    // Prepare content for the AI
    const contentToProcess =
      material.extractedText || material.summary || material.title;

    try {
      const { text } = await generateText({
        model: google("models/gemini-1.5-flash"),
        system:
          "You are an expert podcast producer. Your goal is to convert reading materials into engaging, two-person dialogue scripts suitable for audio.",
        prompt: `Convert the following learning material into a podcast script between a Host (Jane) and an Expert (Dr. Alex).
        
        Rules:
        1. Keep it concise (approx. 3-5 minutes read time).
        2. Make it conversational and engaging, not just reading the text.
        3. Explain complex concepts with analogies.
        4. Format exactly as:
        Jane: [Text]
        Alex: [Text]
        Jane: [Text]
        ...
        
        Material Content:
        ${contentToProcess.slice(0, 10000)}`, // Limit context window
      });

      await ctx.runMutation(internal.materials.saveAudioScript, {
        materialId: args.materialId,
        script: text,
      });
    } catch (error) {
      console.error("Failed to generate audio script:", error);
      throw new Error("Failed to generate audio overview");
    }
  },
});

// Update a user material
export const update = mutation({
  args: {
    id: v.id("user_materials"),
    title: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    linkedCourseId: v.optional(v.id("courses")),
    recommendedVideos: v.optional(
      v.array(
        v.object({
          youtubeId: v.string(),
          title: v.string(),
          thumbnail: v.optional(v.string()),
          relevanceScore: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const material = await ctx.db.get(args.id);
    if (!material || material.userId !== userId) {
      throw new Error("Material not found or unauthorized");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );

    await ctx.db.patch(args.id, {
      ...filteredUpdates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Record study activity
export const recordStudy = mutation({
  args: {
    id: v.id("user_materials"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const material = await ctx.db.get(args.id);
    if (!material || material.userId !== userId) {
      throw new Error("Material not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      lastStudiedAt: new Date().toISOString(),
      studyCount: material.studyCount + 1,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Delete a user material
export const remove = mutation({
  args: {
    id: v.id("user_materials"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const material = await ctx.db.get(args.id);
    if (!material || material.userId !== userId) {
      throw new Error("Material not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Get stats for dashboard
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;

    const materials = await ctx.db
      .query("user_materials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalCount = materials.length;
    const withCourse = materials.filter((m) => m.linkedCourseId).length;
    const withRecommendations = materials.filter(
      (m) => m.recommendedVideos && m.recommendedVideos.length > 0,
    ).length;

    // Group by file type
    const byType = materials.reduce(
      (acc, m) => {
        acc[m.fileType] = (acc[m.fileType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalCount,
      withCourse,
      withRecommendations,
      byType,
    };
  },
});
