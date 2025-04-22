# AI Architecture and Workflow for Course Generation

This document outlines the architecture and workflow related to the AI-powered course generation features in the Tenzzen application.

## 1. Overall Architecture

The system utilizes a combination of a Next.js frontend, a Convex backend for data persistence, and Google AI models (specifically Gemini via the Generative AI SDK and potentially the Agent Development Kit - ADK) for content generation.

### High-Level Component Overview:

1. **Frontend (Next.js):**

   - Provides the user interface for inputting YouTube video URLs/IDs
   - Displays the generated course content
   - Located in `app/`, `components/`, `hooks/`

2. **Next.js API Routes:**

   - Handle requests from the frontend for course generation
   - Orchestrate fetching necessary data (transcripts, metadata)
   - Interact with the AI components (Direct Client or ADK Service)
   - Save generated content to the database
   - Located in `app/api/course-generation/`:
     - `google-ai/route.ts`: Uses the direct Gemini client
     - `google-adk/route.ts`: Calls the separate ADK service

3. **Direct Gemini Client (TypeScript):**

   - Uses the `@google/generative-ai` SDK to interact directly with the Google Gemini API
   - Leverages function calling for structured output and potential external data fetching
   - Defined in:
     - `tools/googleAiClient.ts`
     - `tools/googleAiCourseGenerator.ts`
     - `tools/googleAiTools.ts`

4. **ADK Service (Python):**
   - A separate Python backend service built using Google's Agent Development Kit (ADK) and FastAPI
   - Components:
     - ADK agent (`adk_service/agent.py`) designed for course generation (currently using `gemini-2.5-pro-preview-03-25` model)
     - Custom tools (`adk_service/tools.py`) for external API interactions
     - FastAPI server (`adk_service/server.py`)
   - Runs in dedicated virtual environment (`adk_service/.venv`)
   - Uses `google.adk` imports for ADK functionality

## 2. AI Workflow: Course Generation

### Step-by-Step Process:

1. **User Input & Data Collection**

   - User provides YouTube video URL/ID via frontend
   - System fetches video metadata and transcript
   - Data stored in Convex DB for persistence

2. **Course Generation Trigger**

   - User initiates generation via UI button
   - Frontend calls appropriate API route based on configuration

3. **AI Processing**

   - **Direct Gemini Path:**

     ```typescript
     // Simplified flow in google-ai/route.ts
     const response = await googleAiClient.generateCourse({
       transcript,
       metadata,
       schema: courseSchema,
     });
     ```

   - **ADK Service Path:**
     ```python
     # Simplified flow in agent.py
     @agent.tool("generate_course")
     async def generate_course(transcript: str, metadata: dict):
         # Process with ADK agent and tools
         return structured_course_content
     ```

4. **Response Processing & Storage**
   - AI output validated against schema
   - Course content saved to Convex DB
   - Success/error response sent to frontend

## 3. Implementation Guidelines

### API Key Management

```typescript
// Environment variables (.env)
GOOGLE_AI_API_KEY = your_key_here;
YOUTUBE_API_KEY = your_key_here;

// Verification route
// app/api/course-generation/verify-key/route.ts
export async function POST(req: Request) {
  const { key } = await req.json();
  const isValid = await verifyGoogleAIKey(key);
  return Response.json({ valid: isValid });
}
```

### Schema Enforcement

```typescript
// tools/googleAiCourseSchema.ts
export const courseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          lessons: { type: "array" },
        },
      },
    },
  },
};
```

### Error Handling

```typescript
// Example error handling in API route
try {
  const course = await generateCourse(transcript);
  await saveToDB(course);
} catch (error) {
  if (error instanceof AIError) {
    return Response.json({ error: "AI Generation Failed" }, { status: 500 });
  }
  // Handle other error types
}
```

## 4. Rules & Best Practices

1. **Security**

   - Never expose API keys in client-side code
   - Validate all user inputs
   - Use HTTPS for ADK service communication

2. **Performance**

   - Cache frequently accessed data
   - Implement request timeouts
   - Consider rate limiting for API calls

3. **Code Organization**

   - Keep AI logic separate from UI components
   - Use typed interfaces for data structures
   - Document complex AI interactions

4. **Error Management**

   - Implement comprehensive error handling
   - Provide meaningful error messages
   - Log failures for debugging

5. **Testing**
   - Unit test AI response parsing
   - Mock AI calls in tests
   - Validate schema compliance

## 5. Environment Setup

```bash
# ADK Service Setup
cd adk_service
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install -r requirements.txt

# Verify imports
python -c "from google.adk import agent_context"
```

## 6. Monitoring & Maintenance

1. **Response Quality**

   - Monitor AI response quality
   - Track user feedback
   - Adjust prompts as needed

2. **API Usage**

   - Track API call volumes
   - Monitor costs
   - Implement usage quotas

3. **Performance Metrics**
   - Track generation times
   - Monitor error rates
   - Measure user satisfaction
