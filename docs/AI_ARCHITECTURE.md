# AI Architecture and Workflow for Course Generation

This document outlines the architecture and workflow related to the AI-powered course generation features in the Tenzzen application.

## 1. Overall Architecture

The system utilizes a Next.js frontend, a Convex backend for data persistence, and **Vercel AI SDK with Google Gemini models** for AI-powered content generation.

### High-Level Component Overview:

1.  **Frontend (Next.js):**

    - Provides the user interface for inputting YouTube video URLs/IDs
    - Displays the generated course content
    - Located in `app/`, `components/`, `hooks/`

2.  **Server Actions (Next.js):**

    - Primary interface for AI operations
    - Orchestrate YouTube data fetching → AI generation → Convex storage
    - Located in `actions/`:
      - `generateCourseFromYoutube.ts`: Main course generation from YouTube content
      - `generateQuiz.ts`: Quiz generation from lesson content
      - `getYoutubeTranscript.ts`: Transcript extraction
      - `getYoutubeData.ts`: Video/playlist metadata fetching

3.  **AI Client Layer (TypeScript - Vercel AI SDK):**

    - **Currently implemented and functional**
    - Located in `lib/ai/`:
      - `client.ts`: Main AIClient with methods for course generation, quiz creation, summaries
      - `config.ts`: Model configuration (gemini-1.5-flash, gemini-1.5-pro)
      - `prompts.ts`: Structured prompt templates following educational best practices
      - `types.ts`: Zod schemas for structured AI outputs
    - Uses `@ai-sdk/google` and `ai` packages for Gemini integration
    - Supports both `generateText()` and `generateObject()` for structured outputs

4.  **Legacy ADK Service (Python) - DEPRECATED:**
    - **Status:** No longer used. Application has migrated to Vercel AI SDK.
    - The `adk_service/` directory and related API routes (`app/api/course-generation/google-adk/`) are obsolete.
    - Reason for migration: ADK had internal errors and Vercel AI SDK provides better TypeScript integration.

## 2. AI Workflow: Course Generation (Current Implementation)

### Step-by-Step Process:

1.  **User Input:**

    - User provides YouTube video URL/ID via frontend UI
    - Can be single video or full playlist

2.  **Course Generation Trigger:**

    - User clicks generation button in analysis page or course creation dialog
    - Frontend calls server action `generateCourseFromYoutube()`

3.  **Data Fetching (Server Action):**

    - `actions/generateCourseFromYoutube.ts` orchestrates the process:
      1. Parses YouTube URL to extract video/playlist ID
      2. Calls `getYoutubeData()` to fetch metadata (title, description, channel)
      3. Calls `getYoutubeTranscript()` to extract video captions
      4. Both functions use Convex caching to reduce API calls

4.  **AI Processing (Vercel AI SDK):**

    - Calls `AIClient.generateCourseOutline()` from `lib/ai/client.ts`
    - Two-phase generation process:
      1. **Content Analysis**: Uses `generateText()` with lower temperature (0.3) to analyze transcript and identify key concepts
      2. **Course Structure**: Uses `generateObject()` with Zod schema to create structured course outline
    - Model: `gemini-1.5-pro` (configurable via `AI_MODEL_SMART` env var)
    - Prompts follow educational best practices from `COURSE_GENERATION_PROCESS.md`

5.  **Database Storage (Convex):**

    - Calls Convex mutation `api.courses.createAICourse`
    - Stores course metadata, modules, and lessons in structured format
    - Returns generated course ID

6.  **Response to Frontend:**

    - Server action returns `{ success: true, courseId }` or error
    - Frontend navigates to course detail page on success
    - Displays error toast if generation fails

7.  **Error Handling:**
    - Quota exceeded: Clear error message about Google API limits
    - Invalid URL: Validation error returned immediately
    - Transcript unavailable: Fallback error with helpful message
    - All errors logged for debugging

## 3. Implementation Guidelines

### API Key Management

```typescript
// Environment variables (.env.local)
GOOGLE_GENERATIVE_AI_API_KEY = your_key_here; // Required for Gemini
YOUTUBE_API_KEY = your_key_here; // Required for YouTube Data API

// Optional model overrides
AI_MODEL_DEFAULT = gemini - 1.5 - flash;
AI_MODEL_FAST = gemini - 1.5 - flash;
AI_MODEL_SMART = gemini - 1.5 - pro;

// Configuration in lib/ai/config.ts
export const aiConfig = {
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  models: {
    default: process.env.AI_MODEL_DEFAULT || "gemini-1.5-flash",
    fast: process.env.AI_MODEL_FAST || "gemini-1.5-flash",
    smart: process.env.AI_MODEL_SMART || "gemini-1.5-pro",
  },
  parameters: {
    maxTokens: 8192,
    temperature: 0.2,
    topP: 0.95,
    topK: 40,
  },
};
```

### Schema Enforcement with Zod

```typescript
// lib/ai/types.ts - Structured output schemas
import { z } from "zod";

export const CourseOutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(z.string()),
  prerequisites: z.array(z.string()),
  targetAudience: z.string(),
  estimatedDuration: z.string(),
  modules: z.array(ModuleSchema),
});

// Usage in AI client
const { object } = await generateObject({
  model: getModel("smart"),
  schema: CourseOutlineSchema,
  prompt: structurePrompt,
});
```

### Error Handling

```typescript
// Server action error handling
export async function generateCourseFromYoutube(url: string, options: any) {
  try {
    const data = await getVideoDetails(videoId);
    const transcript = await getYoutubeTranscript(videoId);
    const course = await AIClient.generateCourseOutline({...});
    const courseId = await convex.mutation(api.courses.createAICourse, {...});

    return { success: true, courseId };
  } catch (error) {
    console.error('Course generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

## 4. Rules & Best Practices

1.  **Security:** (As previously stated)
2.  **Performance:** (As previously stated)
3.  **Code Organization:** (As previously stated)
4.  **Error Management:** (As previously stated)
5.  **Testing:** (As previously stated)

## 5. Environment Setup

```bash
# Main Application Setup
pnpm install  # Install all dependencies including @ai-sdk/google and ai packages

# Set required environment variables in .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Optional: Override default models
AI_MODEL_SMART=gemini-1.5-pro  # or gemini-2.0-flash-exp for experimental

# Start development servers
pnpm convex  # Terminal 1: Convex backend (required first)
pnpm dev     # Terminal 2: Next.js frontend
```

### Legacy ADK Service (Not Required)

The `adk_service/` directory is maintained for reference but not used:

```bash
# Only if you want to experiment with ADK (not integrated)
cd adk_service
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

## 6. Monitoring & Maintenance

(As previously stated)

## 7. Current Status & Known Issues

### ✅ Working Features

- **Course Generation**: Fully functional via Vercel AI SDK + Gemini
- **YouTube Integration**: Metadata and transcript fetching with Convex caching
- **Structured Outputs**: Zod schemas ensure type-safe AI responses
- **Error Handling**: Comprehensive error messages for quota limits, invalid URLs, etc.
- **Database Integration**: Seamless storage in Convex with proper schema

### ⚠️ Recent Fixes

- **Model Configuration**: Changed from `gemini-2.5-pro-exp` (quota issues) to stable `gemini-1.5-pro`
- **Data Structure Bug**: Fixed incorrect property access in `generateCourseFromYoutube.ts` (was accessing `data.video.title`, now correctly uses `data.title`)
- **Type Safety**: Added defensive filtering in playlist video processing to handle malformed data

### 🔧 Recommended Improvements

1.  **Remove Obsolete Code**: Delete `app/api/course-generation/google-adk/` and `app/api/course-generation/google-ai/` routes (replaced by server actions)
2.  **Update Documentation**: Clean up references to ADK service in README and other docs
3.  **Environment Variables**: Remove unused `NEXT_PUBLIC_ADK_SERVICE_URL` references
4.  **Model Selection**: Consider implementing adaptive model selection based on content length
5.  **Streaming Support**: Add streaming responses for better UX during long course generations

### 📊 API Usage

- **Primary Model**: `gemini-1.5-pro` for course generation (smart tasks)
- **Fast Model**: `gemini-1.5-flash` for summaries and simple tasks
- **Quota Management**: Monitor usage at https://ai.dev/usage?tab=rate-limit
- **Cost Optimization**: Use `gemini-1.5-flash` where possible (cheaper, faster)
