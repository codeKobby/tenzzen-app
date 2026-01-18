import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIClient } from "@/lib/ai/client";
import { getVideoDetails, getPlaylistDetails } from "@/actions/getYoutubeData";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import {
  getCachedTranscript,
  setCachedTranscript,
} from "@/lib/server/transcript-cache";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max

interface StreamMessage {
  type: "progress" | "partial" | "complete" | "error";
  step?: string;
  progress?: number;
  message?: string;
  data?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { getToken, userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { youtubeUrl, isPublic = false } = body;

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 },
      );
    }

    // Check user credits
    const convex = new ConvexHttpClient(config.convex.url);
    convex.setAuth(token);

    const hasCredits = await convex.query(api.users.hasCredits, {
      clerkId: userId,
      amount: 1,
    });
    if (!hasCredits) {
      return NextResponse.json(
        {
          error:
            "Insufficient credits. Please upgrade your plan or purchase more credits.",
        },
        { status: 403 },
      );
    }

    // Create a TransformStream for sending updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send messages to client
    const sendMessage = async (msg: StreamMessage) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
    };

    // Start the generation process asynchronously
    (async () => {
      try {
        await sendMessage({
          type: "progress",
          step: "Parsing",
          progress: 5,
          message: "Parsing YouTube URL...",
        });

        // Parse YouTube URL
        const urlPattern =
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const playlistPattern =
          /(?:youtube\.com\/(?:playlist\?|.*[?&]list=)|youtu\.be\/.*[?&]list=)([^"&?\/\s]+)/;

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
          throw new Error("Invalid YouTube URL");
        }

        await sendMessage({
          type: "progress",
          step: "Fetching",
          progress: 15,
          message: "Fetching video metadata...",
        });

        // Fetch video/playlist data
        let data: any;
        if (playlistId) {
          data = await getPlaylistDetails(playlistId);
          videoId = data.videos[0]?.videoId;
        } else if (videoId) {
          data = await getVideoDetails(videoId);
        }

        if (!videoId) {
          throw new Error("No video found to generate course from");
        }

        // Check for existing course
        const convex = new ConvexHttpClient(config.convex.url);
        convex.setAuth(token);

        await sendMessage({
          type: "progress",
          step: "Checking",
          progress: 20,
          message: "Checking for existing course...",
        });

        const existingCourse = await convex.query(
          api.courses.getCourseBySourceId,
          {
            sourceId: videoId,
            userId,
          },
        );

        if (existingCourse) {
          await sendMessage({
            type: "complete",
            data: { courseId: existingCourse._id },
          });
          await writer.close();
          return;
        }

        await sendMessage({
          type: "progress",
          step: "Transcript",
          progress: 30,
          message: "Fetching video transcript...",
        });

        // Get transcript
        const cachedTranscript = getCachedTranscript(videoId);
        let transcriptSegments = cachedTranscript?.segments;
        let transcript = cachedTranscript?.transcriptText;

        if (
          !transcriptSegments ||
          !transcript ||
          transcriptSegments.length === 0
        ) {
          transcriptSegments = await getYoutubeTranscript(videoId);

          if (!transcriptSegments || transcriptSegments.length === 0) {
            throw new Error("Failed to fetch transcript");
          }

          transcript = transcriptSegments
            .map((entry: any) => entry.text)
            .join(" ")
            .trim();

          setCachedTranscript(videoId, transcriptSegments, transcript);
        }

        await sendMessage({
          type: "progress",
          step: "Generating",
          progress: 40,
          message: "AI is analyzing content and generating course structure...",
        });

        // Stream course generation
        const result = await AIClient.streamCourseOutline({
          videoTitle: data.title || "Unknown Title",
          videoDescription: data.description || "",
          transcript,
          transcriptSegments,
          channelName: data.channelName || "Unknown",
          videoDuration: data.duration || "",
        });

        // Track progress through streaming with validation
        let lastProgress = 40;
        let partialCount = 0;

        for await (const partialObject of result.partialObjectStream) {
          partialCount++;

          // AGGRESSIVE timestamp validation to stop malformed generation immediately
          if (partialObject && typeof partialObject === "object") {
            const modules = (partialObject as any).modules || [];

            for (const module of modules) {
              if (module && module.lessons) {
                for (const lesson of module.lessons) {
                  if (lesson) {
                    // Aggressive truncation for timestampStart
                    if (lesson.timestampStart) {
                      const original = lesson.timestampStart;
                      // If it has a decimal or is too long, truncate IMMEDIATELY
                      if (original.includes(".") || original.length > 8) {
                        // Extract only M:SS or H:MM:SS format (no decimals)
                        const match = original.match(
                          /^(\d{1,2}:\d{2}(?::\d{2})?)(?=\.|$)/,
                        );
                        if (match) {
                          lesson.timestampStart = match[1];
                        } else {
                          // Fallback: try to extract just the time part before any decimal
                          const beforeDecimal = original.split(".")[0];
                          lesson.timestampStart =
                            beforeDecimal.length <= 8 ? beforeDecimal : "0:00";
                        }
                        if (original.length > 10) {
                          console.warn(
                            `⚠️ Truncated malformed timestampStart (${original.length} chars): "${original.substring(0, 20)}..." → "${lesson.timestampStart}"`,
                          );
                        }
                      }
                    }

                    // Aggressive truncation for timestampEnd
                    if (lesson.timestampEnd) {
                      const original = lesson.timestampEnd;
                      if (original.includes(".") || original.length > 8) {
                        const match = original.match(
                          /^(\d{1,2}:\d{2}(?::\d{2})?)(?=\.|$)/,
                        );
                        if (match) {
                          lesson.timestampEnd = match[1];
                        } else {
                          const beforeDecimal = original.split(".")[0];
                          lesson.timestampEnd =
                            beforeDecimal.length <= 8 ? beforeDecimal : "0:00";
                        }
                        if (original.length > 10) {
                          console.warn(
                            `⚠️ Truncated malformed timestampEnd (${original.length} chars): "${original.substring(0, 20)}..." → "${lesson.timestampEnd}"`,
                          );
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          // Increment progress gradually as we receive parts
          lastProgress = Math.min(85, lastProgress + 5);

          await sendMessage({
            type: "partial",
            progress: lastProgress,
            message: `Building course structure... (${partialCount} updates)`,
            data: partialObject,
          });
        }

        console.log(`✅ Stream completed with ${partialCount} partial updates`);

        // Get final object (this will apply Zod schema validation)
        const courseOutline = await result.object;

        // Defensive runtime validation: ensure we received an object
        if (
          !courseOutline ||
          typeof courseOutline !== "object" ||
          Array.isArray(courseOutline)
        ) {
          throw new Error(
            "AI generated an invalid course outline. Please try again.",
          );
        }

        // Narrow the type for TypeScript and use a local alias
        const outline = courseOutline as {
          title: string;
          description: string;
          detailedOverview: string;
          category: string;
          difficulty: string;
          learningObjectives: any;
          prerequisites: any;
          targetAudience: any;
          estimatedDuration: string;
          tags: string[];
          resources?: Array<any>;
          modules: Array<{
            title: string;
            description: string;
            lessons: Array<any>;
          }>;
          assessmentPlan?: any;
        };

        // Validate required fields
        if (
          !outline.title ||
          !outline.description ||
          !outline.category ||
          !outline.difficulty
        ) {
          throw new Error(
            "AI failed to generate required course information. Please try again with a different video.",
          );
        }

        if (!outline.modules || outline.modules.length === 0) {
          throw new Error(
            "AI could not generate course modules from this video. Please try a different video with clearer content.",
          );
        }

        console.log("✅ Final course outline validated successfully");

        await sendMessage({
          type: "progress",
          step: "Saving",
          progress: 90,
          message: "Saving course to database...",
        });

        // Sanitize resources: remove any extra fields (e.g., provenance) that Convex validator may reject
        const sanitizedResources = (outline.resources || []).map((r: any) => ({
          title: r?.title || "",
          url: r?.url || "",
          type: r?.type || "Website",
          description: r?.description || undefined,
          category: r?.category || "Other Resources",
        }));

        // Store in Convex
        const courseId = await convex.mutation(api.courses.createAICourse, {
          course: {
            title: data.title || outline.title,
            description: outline.description,
            detailedOverview: outline.detailedOverview,
            category: outline.category,
            difficulty: outline.difficulty,
            learningObjectives: outline.learningObjectives,
            prerequisites: outline.prerequisites,
            targetAudience: outline.targetAudience,
            estimatedDuration: data.duration || outline.estimatedDuration,
            tags: outline.tags,
            resources: sanitizedResources,
            sourceType: "youtube" as const,
            sourceId: videoId,
            sourceUrl: youtubeUrl,
            isPublic: isPublic ?? false,
            aiModel: "gpt-4o",
          },
          modules: outline.modules.map((module: any) => ({
            title: module.title,
            description: module.description,
            lessons: (module.lessons || []).map((lesson: any) => ({
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              durationMinutes: lesson.durationMinutes,
              timestampStart: lesson.timestampStart,
              timestampEnd: lesson.timestampEnd,
              keyPoints: lesson.keyPoints,
            })),
          })),
          assessmentPlan: outline.assessmentPlan,
        });

        // Deduct credit on success
        await convex.mutation(api.users.deductCredits, {
          clerkId: userId,
          amount: 1,
        });
        console.log(`✅ Deducted 1 credit from user ${userId}`);

        await writer.close();
      } catch (error) {
        console.error("Error in stream generation:", error);
        await sendMessage({
          type: "error",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        await writer.close();
      }
    })();

    // Return the readable stream
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error setting up stream:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
