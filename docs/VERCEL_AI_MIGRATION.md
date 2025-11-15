# Vercel AI SDK Migration Guide

## Overview

This document outlines the plan and instructions for integrating the Vercel AI SDK into Tenzzen to power AI-driven course generation, quiz creation, summaries, and AI tutor features. This is a **greenfield implementation** rather than a migration from an existing AI stack, as the codebase currently has no AI model integration—only YouTube data fetching and UI placeholders.

## Current State

### What Exists Today

- **YouTube Data Pipeline**: Server actions fetch video/playlist metadata and transcripts
  - `actions/getYoutubeData.ts` - Fetches YouTube metadata via YouTube Data API
  - `actions/getYoutubeTranscript.ts` - Scrapes and parses YouTube captions
  - Convex caching layer in `convex/videos.ts`
- **UI Placeholders**: Components reference AI features but don't call any AI services
  - `components/course-generate-button.tsx` - Has TODO for AI generation
  - `components/youtube-content-form.tsx` - UI ready but no backend integration
  - Various landing/dashboard copy mentions AI analysis, but no implementation
- **Architecture**: Next.js 15 App Router + Convex backend + Clerk auth + TypeScript

### What's Missing

- No AI model SDK integration (no OpenAI, Anthropic, or Vercel AI SDK imports)
- No `lib/ai` abstraction layer
- No AI-related environment variables or configuration
- No server actions or API routes for AI generation
- No Convex schema for storing AI-generated courses/quizzes

## Migration Goals

1. **Implement Vercel AI SDK** as the primary AI integration layer
2. **Create reusable AI abstractions** in `lib/ai/` for model configuration and prompts
3. **Build server actions** that orchestrate YouTube data → AI generation → Convex storage
4. **Wire up existing UI components** to call new AI endpoints
5. **Support streaming responses** for real-time course generation feedback
6. **Enable multiple AI features**: course generation, quiz creation, summaries, AI tutor chat

## Architecture Design

### Tech Stack Additions

```
- @ai-sdk/openai       # Vercel AI SDK OpenAI provider
- ai                   # Vercel AI SDK core (streaming, prompts, etc.)
```

### Directory Structure

```
lib/
  ai/
    client.ts          # Main AI client abstraction
    config.ts          # AI configuration (models, tokens, temperature)
    prompts.ts         # Structured prompts for course/quiz generation
    types.ts           # AI-specific TypeScript types
    utils.ts           # Helper functions (token counting, retry logic)

actions/
  generateCourseFromYoutube.ts    # Server action: YouTube → AI course
  generateQuiz.ts                  # Server action: Lesson → AI quiz
  generateSummary.ts               # Server action: Content → AI summary
  generateCourseContinuation.ts    # Server action: Expand existing course

app/api/
  ai/
    course/
      route.ts         # Streaming course generation endpoint
    chat/
      route.ts         # AI tutor chat endpoint (streaming)
    quiz/
      route.ts         # Quiz generation endpoint

convex/
  courses.ts           # Schema + mutations for AI-generated courses
  quizzes.ts           # Schema + mutations for AI-generated quizzes
  lessons.ts           # Schema + mutations for lessons with AI content
```

## Implementation Phases

### Phase 1: Foundation Setup (Day 1)

**Goal**: Set up Vercel AI SDK, configuration, and basic client abstraction

#### 1.1 Install Dependencies

```bash
pnpm add ai @ai-sdk/openai zod
```

#### 1.2 Environment Variables

Add to `.env.local`:

```bash
# AI Configuration
OPENAI_API_KEY=sk-...                    # Required: OpenAI API key
AI_MODEL_DEFAULT=gpt-4o                  # Optional: Default model
AI_MODEL_FAST=gpt-4o-mini                # Optional: Fast model for simple tasks
AI_MODEL_SMART=o1-preview                # Optional: Advanced model for complex reasoning
AI_MAX_TOKENS=4096                       # Optional: Max tokens per request
AI_TEMPERATURE=0.7                       # Optional: Creativity level (0-1)
```

Update `SETUP.md` to document these new environment variables.

#### 1.3 AI Configuration Module

**File**: `lib/ai/config.ts`

```typescript
import { openai } from "@ai-sdk/openai";

export const aiConfig = {
  // Model selection
  models: {
    default: process.env.AI_MODEL_DEFAULT || "gpt-4o",
    fast: process.env.AI_MODEL_FAST || "gpt-4o-mini",
    smart: process.env.AI_MODEL_SMART || "o1-preview",
  },

  // Generation parameters
  parameters: {
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "4096"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
    topP: 0.9,
  },

  // Feature flags
  features: {
    streaming: true,
    functionCalling: true,
  },
} as const;

// Provider instances
export const getModel = (type: "default" | "fast" | "smart" = "default") => {
  return openai(aiConfig.models[type]);
};
```

#### 1.4 AI Types

**File**: `lib/ai/types.ts`

```typescript
import { z } from "zod";

// Course structure
export const LessonSchema = z.object({
  title: z.string(),
  description: z.string(),
  durationMinutes: z.number(),
  keyPoints: z.array(z.string()),
  content: z.string(),
});

export const ModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  lessons: z.array(LessonSchema),
});

export const CourseOutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(z.string()),
  prerequisites: z.array(z.string()),
  targetAudience: z.string(),
  estimatedDuration: z.string(),
  modules: z.array(ModuleSchema),
});

export type CourseOutline = z.infer<typeof CourseOutlineSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Lesson = z.infer<typeof LessonSchema>;

// Quiz structure
export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const QuizSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(QuizQuestionSchema),
  passingScore: z.number(),
});

export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
```

#### 1.5 AI Client Abstraction

**File**: `lib/ai/client.ts`

```typescript
import { generateObject, generateText } from "ai";
import { getModel, aiConfig } from "./config";
import { CourseOutlineSchema, QuizSchema } from "./types";
import type { CourseOutline, Quiz } from "./types";

export class AIClient {
  /**
   * Generate a structured course outline from YouTube transcript and metadata
   */
  static async generateCourseOutline(params: {
    videoTitle: string;
    videoDescription: string;
    transcript: string;
    channelName: string;
  }): Promise<CourseOutline> {
    const prompt = `You are an expert educational course designer. Create a comprehensive, structured learning course based on the following YouTube video content.

Video Title: ${params.videoTitle}
Channel: ${params.channelName}
Description: ${params.videoDescription}

Transcript:
${params.transcript.slice(0, 30000)} // Limit to avoid token overflow

Instructions:
1. Analyze the content and identify key learning concepts
2. Structure the content into logical modules and lessons
3. Each lesson should have clear learning objectives and key takeaways
4. Estimate realistic durations for each lesson
5. Create a progressive learning path from basic to advanced concepts
6. Include prerequisites if the content requires prior knowledge
7. Define the target audience level

Generate a complete course structure with modules, lessons, and all metadata.`;

    const { object } = await generateObject({
      model: getModel("smart"),
      schema: CourseOutlineSchema,
      prompt,
      temperature: aiConfig.parameters.temperature,
      maxTokens: aiConfig.parameters.maxTokens,
    });

    return object;
  }

  /**
   * Generate a quiz for a specific lesson or module
   */
  static async generateQuiz(params: {
    lessonTitle: string;
    lessonContent: string;
    numQuestions?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
  }): Promise<Quiz> {
    const {
      lessonTitle,
      lessonContent,
      numQuestions = 5,
      difficulty = "mixed",
    } = params;

    const prompt = `Create a ${difficulty} difficulty quiz with ${numQuestions} multiple-choice questions based on this lesson.

Lesson Title: ${lessonTitle}

Lesson Content:
${lessonContent}

Requirements:
1. Each question should test understanding of key concepts
2. Provide 4 options for each question
3. Include detailed explanations for correct answers
4. Mix question difficulties if difficulty is 'mixed'
5. Questions should be clear and unambiguous
6. Avoid trick questions; focus on genuine understanding`;

    const { object } = await generateObject({
      model: getModel("default"),
      schema: QuizSchema,
      prompt,
      temperature: 0.8,
      maxTokens: 2048,
    });

    return object;
  }

  /**
   * Generate a summary of content
   */
  static async generateSummary(params: {
    content: string;
    maxLength?: number;
  }): Promise<string> {
    const { content, maxLength = 500 } = params;

    const prompt = `Summarize the following content in approximately ${maxLength} characters. Focus on key points and actionable insights.

Content:
${content}`;

    const { text } = await generateText({
      model: getModel("fast"),
      prompt,
      temperature: 0.5,
      maxTokens: Math.ceil(maxLength / 2), // Rough token estimate
    });

    return text;
  }

  /**
   * Expand or continue generating course content
   */
  static async expandCourse(params: {
    existingCourse: CourseOutline;
    additionalContext: string;
  }): Promise<CourseOutline> {
    const prompt = `You are continuing to develop a course. Here's the existing structure:

${JSON.stringify(params.existingCourse, null, 2)}

Additional context to incorporate:
${params.additionalContext}

Expand and enhance the course by:
1. Adding more lessons to existing modules where appropriate
2. Creating new modules if the content justifies it
3. Deepening lesson content with more details
4. Ensuring logical progression and coherence

Return the complete updated course structure.`;

    const { object } = await generateObject({
      model: getModel("smart"),
      schema: CourseOutlineSchema,
      prompt,
      temperature: 0.7,
      maxTokens: aiConfig.parameters.maxTokens,
    });

    return object;
  }
}
```

### Phase 2: Convex Schema Updates (Day 1-2)

**Goal**: Add tables and mutations to store AI-generated content

#### 2.1 Update Convex Schema

**File**: `convex/schema.ts` (additions)

```typescript
// Add to existing schema
courses: defineTable({
  title: v.string(),
  description: v.string(),
  learningObjectives: v.array(v.string()),
  prerequisites: v.array(v.string()),
  targetAudience: v.string(),
  estimatedDuration: v.string(),

  // Source information
  sourceType: v.union(v.literal('youtube'), v.literal('manual'), v.literal('topic')),
  sourceId: v.optional(v.string()), // YouTube video ID or playlist ID
  sourceUrl: v.optional(v.string()),

  // Metadata
  createdBy: v.string(), // Clerk user ID
  isPublic: v.boolean(),
  isPublished: v.boolean(),
  enrollmentCount: v.number(),
  rating: v.optional(v.number()),

  // AI generation metadata
  generatedBy: v.literal('ai'),
  aiModel: v.string(),
  generatedAt: v.string(),

  // Timestamps
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index('by_user', ['createdBy'])
  .index('by_source', ['sourceType', 'sourceId'])
  .index('by_public', ['isPublic', 'isPublished']),

modules: defineTable({
  courseId: v.id('courses'),
  title: v.string(),
  description: v.string(),
  order: v.number(),

  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index('by_course', ['courseId']),

lessons: defineTable({
  moduleId: v.id('modules'),
  courseId: v.id('courses'),
  title: v.string(),
  description: v.string(),
  content: v.string(),
  durationMinutes: v.number(),
  keyPoints: v.array(v.string()),
  order: v.number(),

  // Video association
  videoId: v.optional(v.id('videos')),

  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index('by_module', ['moduleId'])
  .index('by_course', ['courseId']),

quizzes: defineTable({
  lessonId: v.optional(v.id('lessons')),
  moduleId: v.optional(v.id('modules')),
  courseId: v.id('courses'),

  title: v.string(),
  description: v.string(),
  passingScore: v.number(),

  // AI generation metadata
  generatedBy: v.literal('ai'),
  aiModel: v.string(),

  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index('by_course', ['courseId'])
  .index('by_lesson', ['lessonId']),

quizQuestions: defineTable({
  quizId: v.id('quizzes'),
  question: v.string(),
  options: v.array(v.string()),
  correctAnswer: v.number(),
  explanation: v.string(),
  difficulty: v.union(
    v.literal('easy'),
    v.literal('medium'),
    v.literal('hard')
  ),
  order: v.number(),

  createdAt: v.string(),
})
  .index('by_quiz', ['quizId']),
```

#### 2.2 Create Convex Mutations

**File**: `convex/courses.ts`

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./helpers";

// Mutation to create a complete course with modules and lessons
export const createAICourse = mutation({
  args: {
    course: v.object({
      title: v.string(),
      description: v.string(),
      learningObjectives: v.array(v.string()),
      prerequisites: v.array(v.string()),
      targetAudience: v.string(),
      estimatedDuration: v.string(),
      sourceType: v.union(
        v.literal("youtube"),
        v.literal("manual"),
        v.literal("topic")
      ),
      sourceId: v.optional(v.string()),
      sourceUrl: v.optional(v.string()),
      isPublic: v.boolean(),
      aiModel: v.string(),
    }),
    modules: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        lessons: v.array(
          v.object({
            title: v.string(),
            description: v.string(),
            content: v.string(),
            durationMinutes: v.number(),
            keyPoints: v.array(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = new Date().toISOString();

    // Create course
    const courseId = await ctx.db.insert("courses", {
      ...args.course,
      createdBy: userId,
      isPublished: false,
      enrollmentCount: 0,
      generatedBy: "ai" as const,
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create modules and lessons
    for (
      let moduleIndex = 0;
      moduleIndex < args.modules.length;
      moduleIndex++
    ) {
      const moduleData = args.modules[moduleIndex];

      const moduleId = await ctx.db.insert("modules", {
        courseId,
        title: moduleData.title,
        description: moduleData.description,
        order: moduleIndex,
        createdAt: now,
        updatedAt: now,
      });

      for (
        let lessonIndex = 0;
        lessonIndex < moduleData.lessons.length;
        lessonIndex++
      ) {
        const lessonData = moduleData.lessons[lessonIndex];

        await ctx.db.insert("lessons", {
          moduleId,
          courseId,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          durationMinutes: lessonData.durationMinutes,
          keyPoints: lessonData.keyPoints,
          order: lessonIndex,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return courseId;
  },
});

// Query to get full course with modules and lessons
export const getCourseWithContent = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_module", (q) => q.eq("moduleId", module._id))
          .collect();

        return {
          ...module,
          lessons: lessons.sort((a, b) => a.order - b.order),
        };
      })
    );

    return {
      ...course,
      modules: modulesWithLessons.sort((a, b) => a.order - b.order),
    };
  },
});
```

### Phase 3: Server Actions (Day 2-3)

**Goal**: Create server actions that orchestrate YouTube → AI → Convex flow

#### 3.1 Course Generation Server Action

**File**: `actions/generateCourseFromYoutube.ts`

```typescript
"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { AIClient } from "@/lib/ai/client";
import { getYoutubeData } from "./getYoutubeData";
import { getYoutubeTranscript } from "./getYoutubeTranscript";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(config.convex.url);

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
    // Step 1: Fetch YouTube data
    console.log("Fetching YouTube data...");
    const youtubeData = await getYoutubeData(youtubeUrl);

    if (!youtubeData.success || !youtubeData.data) {
      return {
        success: false,
        error: youtubeData.error || "Failed to fetch YouTube data",
      };
    }

    const { data } = youtubeData;
    const videoId =
      data.type === "video"
        ? data.video.youtubeId
        : data.playlist.videos[0]?.youtubeId;

    if (!videoId) {
      return {
        success: false,
        error: "No video found to generate course from",
      };
    }

    // Step 2: Get transcript
    console.log("Fetching transcript...");
    const transcriptResult = await getYoutubeTranscript(videoId);

    if (!transcriptResult.success || !transcriptResult.transcript) {
      return {
        success: false,
        error: transcriptResult.error || "Failed to fetch transcript",
      };
    }

    const transcript = transcriptResult.transcript
      .map((entry) => entry.text)
      .join(" ");

    // Step 3: Generate course outline with AI
    console.log("Generating course outline with AI...");
    const courseOutline = await AIClient.generateCourseOutline({
      videoTitle:
        data.type === "video" ? data.video.title : data.playlist.title,
      videoDescription:
        data.type === "video"
          ? data.video.description
          : data.playlist.description,
      transcript,
      channelName:
        data.type === "video"
          ? data.video.channelTitle
          : data.playlist.channelTitle || "Unknown",
    });

    // Step 4: Store in Convex
    console.log("Storing course in database...");
    const courseId = await convex.mutation(api.courses.createAICourse, {
      course: {
        title: courseOutline.title,
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
```

### Phase 4: UI Integration (Day 3-4)

**Goal**: Wire existing UI components to call new server actions

#### 4.1 Update Course Generate Button

**File**: `components/course-generate-button.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generateCourseFromYoutube } from "@/actions/generateCourseFromYoutube";
import { useToast } from "@/hooks/use-toast";

interface CourseGenerateButtonProps {
  youtubeUrl: string;
  isPublic?: boolean;
  disabled?: boolean;
}

export function CourseGenerateButton({
  youtubeUrl,
  isPublic = false,
  disabled = false,
}: CourseGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate courses",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateCourseFromYoutube(youtubeUrl, {
        isPublic,
        userId: user.id,
      });

      if (result.success && result.courseId) {
        toast({
          title: "Course generated!",
          description: "Your AI-generated course is ready",
        });

        // Navigate to the new course
        router.push(`/courses/${result.courseId}`);
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate course",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={disabled || isGenerating || !youtubeUrl}
      className='w-full'>
      {isGenerating ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Generating Course...
        </>
      ) : (
        "Generate Course with AI"
      )}
    </Button>
  );
}
```

### Phase 5: Streaming API Routes (Day 4-5)

**Goal**: Add streaming endpoints for real-time AI generation feedback

#### 5.1 Streaming Course Generation Route

**File**: `app/api/ai/course/route.ts`

```typescript
import { streamObject } from "ai";
import { getModel } from "@/lib/ai/config";
import { CourseOutlineSchema } from "@/lib/ai/types";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

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
```

#### 5.2 AI Tutor Chat Route

**File**: `app/api/ai/chat/route.ts`

```typescript
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
- Relate new concepts to previously learned material when possible`;

    const result = streamText({
      model: getModel("default"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

## Testing Strategy

### Unit Tests

- Test AI client methods with mocked responses
- Test Convex mutations with test data
- Test server actions with fixtures

### Integration Tests

1. **End-to-end course generation**:

   - Provide a YouTube URL
   - Verify transcript fetching
   - Verify AI generation
   - Verify Convex storage
   - Verify course retrieval

2. **Quiz generation**:

   - Generate course
   - Generate quiz for a lesson
   - Verify question quality and structure

3. **Streaming endpoints**:
   - Test streaming course generation
   - Test AI tutor chat
   - Verify proper error handling

### Manual Testing Checklist

- [ ] Sign in and navigate to course generation
- [ ] Paste YouTube URL and generate course
- [ ] Verify loading states and progress feedback
- [ ] View generated course structure
- [ ] Generate quiz for a lesson
- [ ] Test AI tutor chat with course context
- [ ] Verify course appears in library
- [ ] Test public/private course settings
- [ ] Verify error handling (invalid URL, API failures)

## Cost & Performance Optimization

### Token Usage Optimization

1. **Transcript truncation**: Limit to 30k chars (~7.5k tokens)
2. **Model selection**: Use fast models for simple tasks
3. **Caching**: Cache AI-generated content in Convex
4. **Batch processing**: Generate multiple quizzes in one request

### Performance Monitoring

- Log AI request tokens and costs
- Track generation times
- Monitor error rates
- Add user feedback collection

### Rate Limiting

- Implement per-user daily generation limits
- Add cooldown periods between generations
- Consider tiered access (free vs. paid)

## Security Considerations

1. **API Key Protection**:

   - Never expose API keys in client code
   - Use server actions and API routes only
   - Validate environment variables on startup

2. **Input Validation**:

   - Validate YouTube URLs before processing
   - Sanitize user-provided course titles/descriptions
   - Limit transcript length to prevent abuse

3. **Authentication**:

   - Verify Clerk user ID in all server actions
   - Check user permissions before creating public courses
   - Rate limit AI generation per user

4. **Content Safety**:
   - Add content moderation for user-generated inputs
   - Filter inappropriate AI-generated content
   - Implement reporting system for problematic courses

## Rollout Plan

### Week 1: Foundation

- Install dependencies and set up configuration
- Create AI client abstraction
- Update Convex schema
- Deploy to development environment

### Week 2: Core Features

- Implement course generation server action
- Wire up UI components
- Add basic error handling
- Internal testing

### Week 3: Advanced Features

- Add streaming endpoints
- Implement quiz generation
- Add AI tutor chat
- Performance optimization

### Week 4: Polish & Launch

- Comprehensive testing
- Documentation
- Beta user testing
- Production deployment
- Monitor metrics and user feedback

## Success Metrics

- **Technical**:

  - AI generation success rate > 95%
  - Average course generation time < 60 seconds
  - API error rate < 1%

- **User Experience**:

  - Course quality rating > 4/5
  - User retention after first course generation > 70%
  - Time to first course < 5 minutes

- **Business**:
  - Number of courses generated
  - Active users generating courses
  - Conversion from free to paid tier

## Troubleshooting Guide

### Common Issues

**Issue**: OpenAI API key not found

- **Solution**: Verify `.env.local` has `OPENAI_API_KEY` set and Next.js server was restarted

**Issue**: Course generation fails with timeout

- **Solution**: Increase `maxTokens` or use faster model; check transcript length

**Issue**: Invalid course structure returned

- **Solution**: Review Zod schema; add more specific prompt instructions

**Issue**: Convex mutation fails

- **Solution**: Check schema matches mutation args; verify user authentication

## Future Enhancements

1. **Multi-provider support**: Add Anthropic, Google Gemini providers
2. **Fine-tuned models**: Train custom models on high-quality educational content
3. **Voice generation**: Add TTS for lesson audio
4. **Image generation**: Create diagrams and illustrations for lessons
5. **Personalized learning**: Adapt content based on user progress
6. **Collaborative editing**: Allow instructors to refine AI-generated courses
7. **Analytics dashboard**: Track AI usage, costs, and quality metrics

## Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

## Support & Questions

For questions or issues during implementation:

1. Check this migration guide first
2. Review Vercel AI SDK docs
3. Check `docs/` folder for related architecture docs
4. Test with simple examples before complex integrations
5. Log detailed error messages for debugging

---

**Last Updated**: November 14, 2025  
**Status**: Ready for Implementation  
**Owner**: Development Team
