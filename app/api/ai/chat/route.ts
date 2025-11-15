import { streamText } from "ai";
import { getModel } from "@/lib/ai/config";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, courseContext } = await req.json();

    const systemPrompt = `You are an AI tutor helping students understand course material.

Course Context:
${courseContext}

Guidelines:
- Be encouraging and supportive
- Explain concepts clearly with examples
- If a student is stuck, break down the problem into smaller steps
- Encourage critical thinking by asking guiding questions
- Correct misconceptions gently
- Relate new concepts to previously learned material`;

    const result = streamText({
      model: getModel("default"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
