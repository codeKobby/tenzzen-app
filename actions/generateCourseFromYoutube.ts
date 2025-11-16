'use server'

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { AIClient } from "@/lib/ai/client";
import { getVideoDetails, getPlaylistDetails } from "./getYoutubeData";
import { getYoutubeTranscript } from "./getYoutubeTranscript";
import type { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";

interface GenerateCourseResult {
  success: boolean;
  courseId?: Id<"courses">;
  error?: string;
}

export async function generateCourseFromYoutube(
  youtubeUrl: string,
  options: {
    isPublic?: boolean;
    userId: string;
  }
): Promise<GenerateCourseResult> {
  try {
    // Get authentication token from Clerk
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    if (!token) {
      return {
        success: false,
        error: "Authentication required. Please sign in.",
      };
    }

    // Create authenticated Convex client
    const convex = new ConvexHttpClient(config.convex.url);
    convex.setAuth(token);

    // Step 1: Parse YouTube URL and fetch data
    console.log("Parsing YouTube URL...");
    const urlPattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const playlistPattern = /(?:youtube\.com\/(?:playlist\?|.*[?&]list=)|youtu\.be\/.*[?&]list=)([^"&?\/\s]+)/;

    let videoId: string | null = null;
    let playlistId: string | null = null;

    const playlistMatch = youtubeUrl.match(playlistPattern);
    if (playlistMatch) {
      playlistId = playlistMatch[1];
    } else {
      const videoMatch = youtubeUrl.match(urlPattern);
      if (videoMatch) {
        videoId = videoMatch[1];
      }
    }

    if (!videoId && !playlistId) {
      return {
        success: false,
        error: "Invalid YouTube URL",
      };
    }

    let data: any;
    if (playlistId) {
      console.log("Fetching playlist data...");
      data = await getPlaylistDetails(playlistId);
      videoId = data.videos[0]?.videoId;
    } else if (videoId) {
      console.log("Fetching video data...");
      data = await getVideoDetails(videoId);
    }

    if (!videoId) {
      return {
        success: false,
        error: "No video found to generate course from",
      };
    }

    // Step 1.5: Check if course already exists for this video
    console.log("Checking for existing course...");
    const existingCourse = await convex.query(api.courses.getCourseBySourceId, {
      sourceId: videoId,
      userId: options.userId,
    });

    if (existingCourse) {
      console.log("Course already exists, returning existing course ID:", existingCourse._id);
      return {
        success: true,
        courseId: existingCourse._id,
      };
    }

    // Step 2: Get transcript
    console.log("Fetching transcript...");
    const transcriptSegments = await getYoutubeTranscript(videoId);

    if (!transcriptSegments || transcriptSegments.length === 0) {
      return {
        success: false,
        error: "Failed to fetch transcript",
      };
    }

    const transcript = transcriptSegments
      .map((entry: any) => entry.text)
      .join(" ");

    // Step 3: Generate course outline with AI
    console.log("Generating course outline with AI...");
    const courseOutline = await AIClient.generateCourseOutline({
      videoTitle: data.title || "Unknown Title",
      videoDescription: data.description || "",
      transcript,
      channelName: data.channelName || "Unknown",
    });

    // Step 4: Store in Convex
    console.log("Storing course in database...");
    const courseId = await convex.mutation(api.courses.createAICourse, {
      course: {
        title: data.title || courseOutline.title, // Use YouTube title, fallback to AI title
        description: courseOutline.description,
        learningObjectives: courseOutline.learningObjectives,
        prerequisites: courseOutline.prerequisites,
        targetAudience: courseOutline.targetAudience,
        estimatedDuration: courseOutline.estimatedDuration,
        sourceType: "youtube" as const,
        sourceId: videoId,
        sourceUrl: youtubeUrl,
        isPublic: options.isPublic ?? false,
        aiModel: "gpt-4o", // From config
      },
      modules: courseOutline.modules.map((module) => ({
        title: module.title,
        description: module.description,
        lessons: module.lessons.map((lesson) => ({
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          durationMinutes: lesson.durationMinutes,
          keyPoints: lesson.keyPoints,
        })),
      })),
    });

    console.log("Course generated successfully:", courseId);
    return {
      success: true,
      courseId,
    };
  } catch (error) {
    console.error("Error generating course:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
