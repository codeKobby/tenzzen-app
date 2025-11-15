import { streamObject } from "ai";
import { getModel } from "@/lib/ai/config";
import { CourseOutlineSchema } from "@/lib/ai/types";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Temporarily bypass auth for testing
    // const { userId } = await auth();
    // if (!userId) {
    //   return new Response("Unauthorized", { status: 401 });
    // }

    const { videoTitle, videoDescription, transcript, channelName } =
      await req.json();

    const prompt = `You are an expert educational course designer. Create a comprehensive, structured learning course based on the following YouTube video content.

Video Title: ${videoTitle}
Channel: ${channelName}
Description: ${videoDescription}

Transcript:
${transcript.slice(0, 30000)}

Instructions:
1. Analyze the content and identify key learning concepts
2. Structure the content into logical modules and lessons
3. Each lesson should have clear learning objectives and key takeaways
4. Estimate realistic durations for each lesson
5. Create a progressive learning path from basic to advanced concepts
6. Include prerequisites if the content requires prior knowledge
7. Define the target audience level

Generate a complete course structure with modules, lessons, and all metadata.`;

    const result = streamObject({
      model: getModel("smart"),
      schema: CourseOutlineSchema,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Streaming error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
