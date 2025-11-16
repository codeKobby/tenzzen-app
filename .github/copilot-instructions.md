# Tenzzen AI Agent Instructions

## Project Architecture

This is a **Next.js 15 App Router** application with **Convex** backend, **Clerk** authentication, and **Vercel AI SDK + Google AI** for course generation from YouTube content.

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Convex (realtime database + serverless functions)
- **Auth**: Clerk with JWT integration (`convex/auth.config.ts`)
- **AI**: Vercel AI SDK + Google Gemini (`@ai-sdk/google`, `ai` package)
- **Optional Python Service**: ADK service (`adk_service/`) with FastAPI + Google ADK
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **Package Manager**: pnpm (strict requirement, see `pnpm-workspace.yaml`)

## Critical Workflows

### Development Setup (Sequential)

```bash
pnpm install                    # Install dependencies (NEVER use npm/yarn)
pnpm convex                     # Terminal 1: Start Convex dev (required)
pnpm dev                        # Terminal 2: Start Next.js (port 3000)
```

**Critical**: Convex must run before Next.js. Frontend depends on Convex realtime connection.

### Environment Variables

Required in `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=       # From Clerk dashboard
CLERK_SECRET_KEY=                        # From Clerk dashboard
CLERK_JWT_ISSUER_DOMAIN=                 # From JWT template named "convex"

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=                  # From `npx convex dev` output

# YouTube & AI
YOUTUBE_API_KEY=                         # For video metadata
GOOGLE_GENERATIVE_AI_API_KEY=            # For Gemini AI generation

# Optional: ADK Python Service (if using)
NEXT_PUBLIC_ADK_SERVICE_URL=             # URL to deployed ADK service
NEXT_PUBLIC_ADK_SERVICE_TIMEOUT=300000   # 5 minute timeout
```

## Architecture Patterns

### Convex Backend: Query/Mutation/Action Pattern

**Schema-first design** (`convex/schema.ts`):

```typescript
courses: defineTable({
  createdBy: v.string(), // Clerk user ID
  sourceType: v.union(v.literal("youtube"), v.literal("manual")),
  sourceId: v.optional(v.string()),
  // ... more fields
})
  .index("by_user", ["createdBy"]) // ALWAYS index query fields
  .index("by_source", ["sourceType", "sourceId"]);
```

**Queries** (client-side realtime reads):

```typescript
// convex/courses.ts
export const getUserCourses = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userId))
      .collect();
  },
});

// Client usage (automatically reactive)
import { useQuery } from "convex/react";
const courses = useQuery(api.courses.getUserCourses, { userId: user.id });
```

**Mutations** (write data):

```typescript
export const createCourse = mutation({
  args: { title: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      createdBy: args.userId,
      createdAt: new Date().toISOString(),
      // ...
    });
    return courseId;
  },
});
```

**Actions** (can call external APIs, not realtime):

```typescript
export const generateCourse = action({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    // Can call external APIs, YouTube API, AI services
    // Use ctx.runMutation() to write to DB
  },
});
```

### Authentication: getUserIdentity Pattern

**In Convex functions** (`convex/helpers.ts`):

```typescript
export async function getUserId(ctx: QueryCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null; // Clerk user ID
}

// Usage in queries/mutations
const userId = await getUserId(ctx);
if (!userId) throw new Error("Unauthorized");
```

**Client-side**: Always use Clerk hooks from `@clerk/nextjs`:

```typescript
import { useUser } from "@clerk/nextjs";
const { user } = useUser(); // user.id is Clerk user ID
```

### Middleware: Onboarding Gate

`middleware.ts` enforces onboarding completion:

```typescript
// Public routes (no auth required)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/explore(.*)",
]);

// Checks sessionClaims?.metadata?.onboardingComplete
// Redirects incomplete users to /onboarding
```

**Key Flow**: Sign up → Clerk metadata check → `/onboarding` (if incomplete) → Protected routes

## Code Conventions

### File Organization

- `app/` - Next.js App Router pages (RSC by default)
- `components/` - Shared components (mark "use client" when needed)
- `convex/` - Backend schema, queries, mutations
- `actions/` - Server Actions (always "use server")
- `hooks/` - Client hooks (always "use client")
- `lib/` - Utilities, config, constants
- `docs/` - Architecture decisions and implementation guides

### Client vs Server Components

- **Default is Server Component** - No directive needed
- Add `"use client"` ONLY when using: hooks, browser APIs, event handlers, Convex hooks
- Add `"use server"` for Server Actions in `actions/`
- See `app/providers.tsx` for provider wrapping pattern

### Provider Architecture

**Root-level providers** (`app/ConvexClientProvider.tsx`):

```typescript
<ClerkProvider>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    {children}
  </ConvexProviderWithClerk>
</ClerkProvider>
```

- Clerk wraps Convex for JWT integration
- `convex` client created in `hooks/use-convex.ts`
- All Convex hooks need this wrapper

### Path Aliases

Configured in `tsconfig.json`:

```typescript
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
```

## Key Implementation Details

### YouTube Integration

- Server Actions fetch YouTube data (`actions/getYoutubeData.ts`)
- Convex caches video/playlist metadata to reduce API calls
- Uses relational table `playlist_videos` for playlist-video mappings

### AI Course Generation Flow

**TypeScript-first approach** (`lib/ai/client.ts`):

1. Server Action receives YouTube URL (`actions/generateCourseFromYoutube.ts`)
2. Fetch video metadata and transcript
3. AIClient generates structured course outline using Vercel AI SDK
4. Write modules, lessons, and quizzes to Convex tables
5. Return course ID for navigation

**ADK Python Service** (optional, in `adk_service/`):

- Separate FastAPI service for advanced AI workflows
- Uses Google ADK with Gemini models
- Deployed independently (Cloud Run recommended)
- Called via `NEXT_PUBLIC_ADK_SERVICE_URL` if configured

### Database Schema Patterns

**Relational patterns in Convex**:

```typescript
// One-to-many with index
courses: defineTable({ ... }).index('by_user', ['createdBy'])
modules: defineTable({ courseId: v.id('courses') }).index('by_course', ['courseId'])

// Many-to-many junction table
playlist_videos: defineTable({
  playlistId: v.string(),
  videoId: v.string(),
  position: v.float64()
})
  .index('by_playlist', ['playlistId'])
  .index('by_video', ['videoId'])
```

### Theme System

- `next-themes` provider in `components/providers.tsx`
- Toggle in `components/theme-toggle.tsx`
- Supports system, light, dark modes with `suppressHydrationWarning` on `<html>`

## Common Pitfalls

1. **Don't mix npm/yarn with pnpm** - Project uses pnpm workspaces
2. **Always run Convex dev server** - Frontend needs backend running
3. **Check "use client" carefully** - Only add when truly needed for performance
4. **Index Convex queries** - Missing indexes cause slow queries
5. **Server Actions are server-only** - Can't use browser APIs or hooks
6. **Onboarding gate** - Authenticated users without `onboardingComplete` redirect to `/onboarding`
