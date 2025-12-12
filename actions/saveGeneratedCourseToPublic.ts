"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { auth } from "@clerk/nextjs/server";

interface SaveGeneratedCourseResult {
  success: boolean;
  courseId?: string;
  error?: string;
}

// Accepts a simplified course payload and saves it as a full AI-generated course
export async function saveGeneratedCourseToPublic(
  payload: {
    title: string;
    description?: string;
    videoId?: string;
    thumbnail?: string;
    courseItems?: Array<{
      title: string;
      content?: string;
      durationMinutes?: number;
    }>;
    metadata?: Record<string, any>;
    transcript?: string;
  },
  options?: { userId?: string }
): Promise<SaveGeneratedCourseResult> {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token) return { success: false, error: "Authentication required" };

    const convex = new ConvexHttpClient(config.convex.url);
    convex.setAuth(token);

    // Build minimal modules/lessons structure from courseItems
    const modules = [] as any[];
    if (payload.courseItems && payload.courseItems.length > 0) {
      const lessons = payload.courseItems.map((ci) => ({
        title: ci.title,
        description: ci.content ?? "",
        content: ci.content ?? "",
        durationMinutes: ci.durationMinutes ?? 0,
        timestampStart: undefined,
        timestampEnd: undefined,
        keyPoints: [],
      }));

      modules.push({
        title: "Generated Content",
        description: "Auto-generated module from video",
        lessons,
      });
    } else {
      // Fallback minimal module/lesson
      modules.push({
        title: "Generated Content",
        description: "Auto-generated module",
        lessons: [
          {
            title: payload.title || "Lesson",
            description: payload.description || "",
            content: payload.description || "",
            durationMinutes: 0,
            timestampStart: undefined,
            timestampEnd: undefined,
            keyPoints: [],
          },
        ],
      });
    }

    const courseArg = {
      title: payload.title,
      description: payload.description ?? "",
      detailedOverview: payload.description ?? "",
      thumbnail: payload.thumbnail,
      category: payload.metadata?.category ?? "Uncategorized",
      difficulty: payload.metadata?.difficulty ?? "Intermediate",
      learningObjectives: payload.metadata?.learningObjectives ?? [],
      prerequisites: payload.metadata?.prerequisites ?? [],
      targetAudience: payload.metadata?.targetAudience ?? "",
      estimatedDuration: payload.metadata?.estimatedDuration ?? "",
      tags: payload.metadata?.tags ?? [],
      resources: payload.metadata?.resources ?? [],
      sourceType: "youtube" as const,
      sourceId: payload.videoId,
      sourceUrl:
        payload.videoId ?
          `https://www.youtube.com/watch?v=${payload.videoId}`
        : undefined,
      isPublic: true,
      aiModel: "gpt-4o",
    };

    const response = await convex.mutation(api.courses.createAICourse, {
      course: courseArg,
      modules: modules.map((m) => ({
        title: m.title,
        description: m.description,
        lessons: m.lessons.map((l: any) => ({
          title: l.title,
          description: l.description,
          content: l.content,
          durationMinutes: l.durationMinutes,
          timestampStart: l.timestampStart,
          timestampEnd: l.timestampEnd,
          keyPoints: l.keyPoints || [],
        })),
      })),
      assessmentPlan: undefined,
    });

    // Response is the new courseId
    const courseId = response;

    // Fetch the inserted course with modules & lessons from Convex
    try {
      const fullCourse = await convex.query(api.courses.getCourseWithContent, {
        courseId,
      });

      if (fullCourse) {
        // Normalize modules -> sections for the dashboard UI
        const sections = (fullCourse.modules || []).map((m: any) => ({
          title: m.title,
          description: m.description || "",
          lessons: (m.lessons || []).map((l: any) => ({
            title: l.title,
            description: l.description || "",
            content: l.content || "",
            durationMinutes: l.durationMinutes || 0,
            timestampStart: l.timestampStart,
            timestampEnd: l.timestampEnd,
            keyPoints: l.keyPoints || [],
          })),
        }));

        // Build a lightweight overview the dashboard expects
        const overview = {
          skills:
            payload.metadata?.skills ??
            sections
              .flatMap((s) => s.lessons.map((l: any) => l.title))
              .slice(0, 8),
          difficulty_level: courseArg.difficulty || "Beginner",
          total_duration:
            courseArg.estimatedDuration ||
            payload.metadata?.estimatedDuration ||
            "",
        };

        // Patch course record with denormalized preview so that getRecentCourses includes sections/overview
        await convex.mutation(api.courses.patchCoursePreview, {
          courseId,
          preview: {
            sections,
            overview,
            thumbnail: payload.thumbnail,
          },
        });
      }
    } catch (err) {
      // Non-fatal: patching preview failed. Still return success but log.
      console.warn("Warning: failed to patch course preview", err);
    }

    // If caller provided a userId, enroll them in the new course so it appears in recentCourses
    try {
      if (options?.userId) {
        await convex.mutation(api.enrollments.enrollInCourse, {
          userId: options.userId,
          courseId,
        });
      }
    } catch (err) {
      console.warn("Warning: failed to enroll user in generated course", err);
    }

    return { success: true, courseId };
  } catch (error) {
    console.error("Error saving generated course to public:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
