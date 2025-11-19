# Tenzzen AI Agent Instructions

## Project Overview

Tenzzen is a **Next.js 15 App Router** application with a **Convex** backend, **Clerk** authentication, and **Vercel AI SDK + Google Gemini** for generating courses from YouTube content. The project emphasizes a schema-first, TypeScript-driven approach, and uses pnpm workspaces for package management.

### Key Technologies

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Convex (realtime DB, serverless functions)
- **Auth**: Clerk (JWT integration, see `convex/auth.config.ts`)
- **AI**: Vercel AI SDK, Google Gemini (`@ai-sdk/google`, `ai`)
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **Python Service**: (removed) ADK service was removed from this repository. Use built-in `actions/` server actions instead.

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
- `adk_service/` — (removed) previously an optional Python AI service
- `middleware.ts` – Onboarding enforcement

````instructions
# Tenzzen — AI Agent Instructions (concise)

This file tells coding agents how to be immediately productive in this repository.

Core facts
- Tech stack: `Next.js 15` (App Router) + `React 18` + `TypeScript` frontend, `Convex` backend, `Clerk` auth. AI integrations use `@ai-sdk/google` and `ai`.
- Package manager: `pnpm` (required). See `package.json` for `engines` (Node >=18.17, pnpm >=9).

Quick start (exact commands)
```bash
pnpm install
pnpm convex    # starts Convex dev server (run this first)
pnpm dev       # runs Next.js on :3000
pnpm build
pnpm lint
```

Repository-specific rules & patterns
- pnpm only: never use `npm` or `yarn`.
- Convex-first: all app state and business logic are modeled through `convex/` (see `convex/schema.ts`). When adding queries, add the corresponding index in `convex/schema.ts`.
- Server Actions: files in `actions/` are server-only. They should start with `"use server"` and may call Convex server APIs directly. Example: `actions/generateCourseFromYoutube.ts`.
- Component split: default to Server Components. Add `"use client"` only when using hooks, browser APIs, or client-only libraries (e.g., `useState`, `useEffect`, or Convex React hooks).
- Auth: Clerk is used site-wide. See `convex/auth.config.ts` for JWT integration and `middleware.ts` for onboarding enforcement (redirects users missing `onboardingComplete`).

Important files to inspect when editing features
- `app/ConvexClientProvider.tsx` — provider wiring (Clerk + Convex JWT flow).
- `convex/schema.ts` — database schema and indexes (required for queries).
- `actions/` — server-only entry points for heavy tasks (YouTube fetch, AI generation).
- `lib/ai/client.ts` — AI client wrappers used by server actions.
- `adk_service/` — (removed) previously an optional FastAPI Python service. Use `actions/recommendVideos` and `lib/ai/client.ts` instead.
- `middleware.ts` — global routing + onboarding enforcement.

Integration notes & examples
- YouTube → AI → Convex flow: `actions/getYoutubeData.ts` (fetch), `actions/getYoutubeTranscript.ts` (transcribe), `actions/generateCourseFromYoutube.ts` (AI outline → store). Use `lib/ai/client.ts` for model calls.
- ADK service: only present if `NEXT_PUBLIC_ADK_SERVICE_URL` set. The Python service is under `adk_service/server.py` (FastAPI).

Developer constraints
- Follow existing coding style and TypeScript types. Avoid changing public APIs unless necessary.
- Tests: repo does not include a full test harness; prefer small manual verification steps (run local convex + dev server, exercise UI flows).

When making edits
- Update `convex/schema.ts` when adding new queryable fields and add indexes.
- If adding server endpoints, prefer `actions/` server actions instead of client-only routes.
- Preserve onboarding behavior: check `middleware.ts` and Clerk metadata keys.

If something is unclear, open a PR or ask the repo owner with a short note referencing the file(s) you changed.

Examples to inspect for patterns: `actions/generateCourseFromYoutube.ts`, `app/ConvexClientProvider.tsx`, `convex/schema.ts`.

````
