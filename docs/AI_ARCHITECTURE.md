# AI Architecture and Workflow for Course Generation

This document outlines the architecture and workflow related to the AI-powered course generation features in the Tenzzen application.

## 1. Overall Architecture

The system utilizes a combination of a Next.js frontend, a Convex backend for data persistence, and Google AI models via the Agent Development Kit (ADK) for content generation.

### High-Level Component Overview:

1.  **Frontend (Next.js):**
    *   Provides the user interface for inputting YouTube video URLs/IDs
    *   Displays the generated course content
    *   Located in `app/`, `components/`, `hooks/`

2.  **Next.js API Routes:**
    *   Handle requests from the frontend for course generation.
    *   Fetch necessary data (transcripts, metadata) from YouTube actions.
    *   Call the ADK service, passing the fetched data.
    *   Located in `app/api/course-generation/`:
        *   `google-ai/route.ts`: **Misnamed.** Fetches data, calls ADK service, consumes the response stream, and returns the final JSON result (or error).
        *   `google-adk/route.ts`: Fetches data, calls ADK service, and streams the raw `ndjson` response (including errors) back to the client.

3.  **Direct Gemini Client (TypeScript):**
    *   **Not currently implemented or used.** The application exclusively uses the ADK service via the Next.js API routes. Files mentioned in previous versions (`tools/googleAiClient.ts`, etc.) do not exist or are unused.

4.  **ADK Service (Python):**
    *   A separate Python backend service built using Google's Agent Development Kit (ADK) and FastAPI.
    *   **Current Status:** The ADK service starts but **fails during agent execution** due to an internal ADK library error (`unhashable type: 'Session'`) likely related to `InMemorySessionService`. AI generation via ADK is currently **non-functional**.
    *   Components:
        *   Simplified ADK agent (`adk_service/agent.py`) using a single `LlmAgent` (currently using `gemini-2.5-pro-preview-03-25` model). Expects transcript/metadata via prompt.
        *   Tools (`adk_service/tools.py`) are defined but currently unused by the simplified agent.
        *   FastAPI server (`adk_service/server.py`) accepts transcript/metadata in the request and passes it to the agent function.
    *   Runs in dedicated virtual environment (`adk_service/.venv`).
    *   Uses `google.adk` imports for ADK functionality.

## 2. AI Workflow: Course Generation (Current Implementation)

### Step-by-Step Process:

1.  **User Input:**
    *   User provides YouTube video URL/ID via frontend.

2.  **Course Generation Trigger:**
    *   User initiates generation via UI button (e.g., `GoogleAICourseGenerateButton`).
    *   Frontend calls either `/api/course-generation/google-ai` or `/api/course-generation/google-adk`.

3.  **Data Fetching (Next.js API Route):**
    *   The called API route (`google-ai` or `google-adk`) uses actions (`getYoutubeData`, `getYoutubeTranscript`) to fetch video metadata and transcript.

4.  **ADK Service Call (Next.js API Route):**
    *   The API route sends a POST request to the ADK service (`http://localhost:8080/generate-course`) with a payload containing `video_id`, `video_title`, `video_description`, `transcript`, and `difficulty`.

5.  **AI Processing (ADK Service):**
    *   FastAPI server (`server.py`) receives the request.
    *   It calls `generate_course_from_video` in `agent.py`, passing the received data.
    *   `agent.py` constructs a detailed prompt including the data and system instructions.
    *   It uses the ADK `Runner` to execute the single `CourseGeneratorAgent` with the prompt.
    *   **Execution Fails:** The `runner.run_async` call throws the `unhashable type: 'Session'` error internally.
    *   The ADK service streams back an error message.

6.  **Response Handling (Next.js API Route):**
    *   `/google-adk`: Streams the error response directly to the frontend.
    *   `/google-ai`: Consumes the error stream, identifies the failure, and returns a 502/503 error response to the frontend.

7.  **Frontend Display:**
    *   The frontend receives the error and displays an appropriate message (e.g., via toast notification).

## 3. Implementation Guidelines

### API Key Management
```typescript
// Environment variables (.env)
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here

// Verification route
// app/api/course-generation/verify-key/route.ts
export async function POST(req: Request) {
  const { key } = await req.json();
  // const isValid = await verifyGoogleAIKey(key); // Assuming verifyGoogleAIKey exists
  // return Response.json({ valid: isValid });
  return Response.json({ valid: false }); // Placeholder
}
```

### Schema Enforcement
```typescript
// tools/googleAiCourseSchema.ts (Used conceptually in ADK prompt)
export const courseSchema = z.object({ ... }); // Using Zod schema defined in the file
```

### Error Handling
```typescript
// Example error handling in API route (google-ai)
try {
  // ... fetch ADK response ...
  if (!adkResponse.ok) { /* Handle backend error */ }
  // ... consume stream ...
  if (!finalCourseData) { /* Handle stream processing error */ }
  return NextResponse.json({ success: true, data: finalCourseData });
} catch (error) {
  // Handle fetch errors, JSON parsing errors, etc.
  return NextResponse.json({ error: ... }, { status: 500 });
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
# Frontend & API Routes
pnpm install
# Set required env vars in .env (see API Key Management)

# ADK Service Setup
cd adk_service
python -m venv .venv
source .venv/Scripts/activate  # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
# Set required env vars in adk_service/.env (GOOGLE_GENERATIVE_AI_API_KEY, YOUTUBE_API_KEY)
```

## 6. Monitoring & Maintenance

(As previously stated)

## 7. Current Known Issues

*   **ADK Service Failure:** The primary blocker is the `unhashable type: 'Session'` error occurring during `runner.run_async` when using `InMemorySessionService`. This prevents any successful AI course generation via ADK. This appears to be an internal ADK library issue.
*   **API Route Naming:** `/api/course-generation/google-ai` is misnamed as it calls the ADK service.
