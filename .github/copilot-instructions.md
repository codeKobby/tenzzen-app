# Tenzzen AI Agent Instructions

## Project Overview

Tenzzen is a **Next.js 15 App Router** application with a **Convex** backend, **Clerk** authentication, and **Vercel AI SDK + Google Gemini** for generating courses from YouTube content. The project emphasizes a schema-first, TypeScript-driven approach, and uses pnpm workspaces for package management.

### Key Technologies

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Convex (realtime DB, serverless functions)
- **Auth**: Clerk (JWT integration, see `convex/auth.config.ts`)
- **AI**: Vercel AI SDK, Google Gemini (`@ai-sdk/google`, `ai`)
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **Python Service**: Optional ADK service (`adk_service/`)

## Essential Workflows

**Development:**

```bash
pnpm install         # Install dependencies (never use npm/yarn)
pnpm convex          # Start Convex dev server (must run before frontend)
pnpm dev             # Start Next.js (port 3000)
```

Convex must be running before the frontend for realtime features.

**Environment:**
Set all required variables in `.env.local` (see `README.md` for details).

## Architecture & Patterns

- **Convex Backend**: Follows a query/mutation/action pattern. Always index query fields in `convex/schema.ts`.
  - Example: `courses` table indexed by `createdBy` and `sourceType, sourceId`.
- **Authentication**: Use `getUserIdentity` in Convex functions and Clerk hooks (`@clerk/nextjs`) on the client.
- **Onboarding Middleware**: `middleware.ts` enforces onboarding via Clerk metadata; incomplete users are redirected to `/onboarding`.
- **Server Actions**: All files in `actions/` are server-only (`"use server"`).
- **Component Conventions**: Default to server components. Add `"use client"` only for hooks, browser APIs, or Convex hooks.
- **Provider Pattern**: See `app/ConvexClientProvider.tsx` for root-level providers. Clerk wraps Convex for JWT integration.
- **Path Aliases**: Use `@/` for imports (see `tsconfig.json`).

## Integration Points

- **YouTube**: Server Actions in `actions/` fetch and cache YouTube data. Convex stores video/playlist metadata and uses a relational table for playlist-video mapping.
- **AI Course Generation**: `actions/generateCourseFromYoutube.ts` and `lib/ai/client.ts` handle the flow: fetch metadata → generate outline with AI → write to Convex → return course ID.
- **ADK Python Service**: Optional FastAPI service in `adk_service/` for advanced AI workflows. Called via `NEXT_PUBLIC_ADK_SERVICE_URL` if set.

## Database Schema

- **Relational Patterns**: Use indexed tables for one-to-many and many-to-many (see `convex/schema.ts`). Example: `playlist_videos` as a junction table.

## UI & Theming

- Uses `next-themes` in `components/providers.tsx` for theme support. Toggle in `components/theme-toggle.tsx`.

## Project-Specific Conventions

- **pnpm only**: Never use npm/yarn. All scripts and installs must use pnpm.
- **Convex-first**: All data flows through Convex; always ensure queries are indexed.
- **Onboarding enforcement**: Authenticated users without `onboardingComplete` are redirected to `/onboarding`.
- **Server/Client split**: Only use `"use client"` when necessary for performance.

## Key Files & Directories

- `app/` – Next.js App Router pages
- `components/` – Shared React components
- `convex/` – Backend schema, queries, mutations
- `actions/` – Server Actions
- `adk_service/` – Optional Python AI service
- `middleware.ts` – Onboarding enforcement
- `tsconfig.json` – Path aliases

---

For more details, see `README.md`, `SETUP.md`, and comments in key files. Update this file as architecture or workflows evolve.
