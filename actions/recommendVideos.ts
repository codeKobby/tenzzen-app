'use server'

import { AIClient } from "@/lib/ai/client";
import type { VideoRecommendations } from "@/lib/ai/types";

interface RecommendVideosResult {
  success: boolean;
  recommendations?: VideoRecommendations;
  error?: string;
}

export async function recommendVideos(params: {
  query: string;
  knowledgeLevel?: string;
  preferredChannels?: string[];
  additionalContext?: string;
  videoLength?: string;
}): Promise<RecommendVideosResult> {
  try {
    const recommendations = await AIClient.generateVideoRecommendations({
      query: params.query,
      knowledgeLevel: params.knowledgeLevel || "Beginner",
      preferredChannels: params.preferredChannels || [],
      additionalContext: params.additionalContext || "",
      videoLength: params.videoLength || "Any",
    });

    return {
      success: true,
      recommendations,
    };
  } catch (error) {
    console.error("Error recommending videos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
