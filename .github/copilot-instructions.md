<<<<<<< HEAD
- Always use context7 mcp to get the latest docs before making any new implementations or any edits.
- Never make ui changes unless specified in the prompt and always stick to what you have been asked to edit and avoid completely editing or altering any ui, if the need arises for you to make a change ask for confirmation first
- Use sequential thinking mcp together with context7 for all database setups.
- use sequential thinking to fix problems and all error fixing tasks.
- use web search tool when necessary.
=======
# Tenzzen AI Agent Instructions

## Project Architecture

This is a **Next.js 15 App Router** application with **Convex** backend, **Clerk** authentication, and **Vercel AI SDK (TypeScript)** for AI features. It transforms YouTube videos/playlists into structured learning experiences.

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Convex (realtime database + serverless functions)
- **Auth**: Clerk with JWT integration to Convex
- **UI**: Radix UI primitives + Tailwind CSS (shadcn/ui components)
- **State**: Zustand for client state
- **Package Manager**: pnpm (required, see `engines` in package.json)

## Critical Workflows

### Development Commands

```bash
pnpm install          # Install dependencies (ALWAYS use pnpm, not npm/yarn)
pnpm dev              # Start Next.js dev server (port 3000)
pnpm convex           # Start Convex dev server (run in separate terminal)
pnpm build            # Build for production
```

**Important**: Always run `pnpm convex` alongside `pnpm dev` for full functionality.

### Environment Setup

Required env vars in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=       # From Clerk JWT template named "convex"
NEXT_PUBLIC_CONVEX_URL=         # From convex dashboard
```

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

### Authentication Flow

1. **Middleware** (`middleware.ts`) handles routing protection:

   - Public routes: `/`, `/sign-in`, `/sign-up`, `/explore`
   - Onboarding check: `sessionClaims?.metadata?.onboardingComplete`
   - Redirects unauthenticated users and incomplete onboarding

2. **Clerk + Convex Integration**:

   - `ConvexClientProvider` wraps Clerk + Convex providers
   - JWT template in Clerk named "convex" required
   - `convex/auth.config.ts` configures Clerk domain validation

3. **Auth Components**:
   - Use `<Authenticated>`, `<Unauthenticated>`, `<AuthLoading>` from `convex/react`
   - See `components/authenticated-layout-client.tsx` for pattern

### Convex Backend Patterns

**Schema Definition** (`convex/schema.ts`):

```typescript
// Always index fields used in queries
videos: defineTable({
  youtubeId: v.string(),
  title: v.string(),
  // ...
}).index("by_youtube_id", ["youtubeId"]);
```

**Queries** (read data):

```typescript
export const getCachedVideo = query({
  args: { youtubeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .unique();
  },
});
```

**Mutations** (write data):

```typescript
export const cacheVideo = mutation({
  args: { youtubeId: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("videos", {
      ...args,
      cachedAt: new Date().toISOString(),
    });
  },
});
```

**Client Usage** (`hooks/use-convex.ts`):

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const video = useQuery(api.videos.getCachedVideo, { youtubeId: "abc123" });
const cacheVideo = useMutation(api.videos.cacheVideo);
```

### Server Actions Pattern

Located in `actions/`, always marked with `"use server"`:

```typescript
"use server";

export async function getYoutubeData(url: string) {
  // Server-side only code
  // Can access env vars, make API calls (including Vercel AI)
  // Returns serializable data to client
}
```

Use `ConvexHttpClient` for server-side Convex calls:

```typescript
import { ConvexHttpClient } from "convex/browser";
const convex = new ConvexHttpClient(config.convex.url);
await convex.query(api.videos.getCachedVideo, { youtubeId });
```

### AI Integration (Vercel AI SDK)

- AI logic lives in **TypeScript** inside this repo (no separate Python service by default).
- Use a small abstraction in `lib/ai/` (for example `lib/ai/client.ts`) to wrap the Vercel AI SDK and model configuration.
- Server Actions in `actions/` orchestrate AI calls:
  - Read video/playlist data and transcripts (e.g. via `getYoutubeData`, `getYoutubeTranscript`, and Convex queries).
  - Call the AI client to generate course outlines, quizzes, or summaries.
  - Write the structured results back into Convex tables.
- Prefer **streaming responses** and server-side generation when using AI for interactive features.

### UI Component Patterns

**shadcn/ui Usage**:

- All UI components in `components/ui/`
- Use `cn()` utility for conditional classes: `cn("base-class", condition && "conditional-class")`
- Theme-aware: CSS variables defined in `app/globals.css`

**Layout Pattern**:

```typescript
// Authenticated pages use wrapper
import { AuthenticatedLayout } from "@/components/authenticated-layout";

export default function Page() {
  return <AuthenticatedLayout>{/* content */}</AuthenticatedLayout>;
}
```

**Styling**:

- Use Tailwind utility classes
- Use CSS variables for theme colors: `bg-background`, `text-foreground`, `border-border`
- Constants for animations: `TRANSITION_DURATION`, `TRANSITION_TIMING` from `lib/constants.ts`

### Path Aliases

Configured in `tsconfig.json` and `next.config.js`:

```typescript
import { Button } from "@/components/ui/button";
import { useConvex } from "@/hooks/use-convex";
import { config } from "@/lib/config";
```

## Key Implementation Details

### YouTube Integration

- Server Actions fetch YouTube data (`actions/getYoutubeData.ts`)
- Convex caches video/playlist metadata to reduce API calls
- Uses relational table `playlist_videos` for playlist-video mappings

### Theme System

- `next-themes` provider in `components/providers.tsx`
- Toggle in `components/theme-toggle.tsx`
- Supports system, light, dark modes with `suppressHydrationWarning` on `<html>`

### Error Handling

- Use `formatErrorMessage()` from `lib/utils.ts` for user-friendly errors
- Convex errors: see `convex/types.ts` for `ApiError` type

## Documentation References

Extensive docs in `docs/`:

- `BACKEND_ARCHITECTURE.md` - API design patterns
- `AUTH_IMPLEMENTATION.md` - Clerk authentication details
- `DESIGN_SYSTEM.md` - Theme tokens and component usage
- `DEVELOPMENT_STATE.md` - Current feature status

## Common Pitfalls

1. **Don't mix npm/yarn with pnpm** - Project uses pnpm workspaces
2. **Always run Convex dev server** - Frontend needs backend running
3. **Check "use client" carefully** - Only add when truly needed for performance
4. **Index Convex queries** - Missing indexes cause slow queries
5. **Server Actions are server-only** - Can't use browser APIs or hooks
6. **Onboarding gate** - Authenticated users without `onboardingComplete` redirect to `/onboarding`
>>>>>>> master
