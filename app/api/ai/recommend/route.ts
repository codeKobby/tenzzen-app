import { NextRequest } from "next/server";
import { AIClient } from "@/lib/ai/client";
import { VideoRecommendationsSchema } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    const { query, knowledgeLevel, preferredChannels, additionalContext, videoLength } = await req.json();

    const recommendations = await AIClient.generateVideoRecommendations({
      query,
      knowledgeLevel: knowledgeLevel || "Beginner",
      preferredChannels: preferredChannels || [],
      additionalContext: additionalContext || "",
      videoLength: videoLength || "Any",
    });

    return Response.json(recommendations);
  } catch (error) {
    console.error("Video recommendation error:", error);
    return Response.json(
      {
        recommendations: [
          {
            videoId: "error_fallback",
            title: "Video Recommendation Service Temporarily Unavailable",
            channelName: "Tenzzen",
            thumbnail: "https://via.placeholder.com/480x360?text=Service+Unavailable",
            duration: "00:00",
            views: "0",
            publishDate: "Now",
            relevanceScore: 1.0,
            benefit: "Please try again later or contact support if the issue persists"
          }
        ]
      },
      { status: 500 }
    );
  }
}
