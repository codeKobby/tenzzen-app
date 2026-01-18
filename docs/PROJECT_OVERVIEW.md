# Tenzzen - AI-Powered Learning Platform

## 1. Project Overview

Tenzzen is an advanced learning platform that transforms unstructured YouTube content into structured, interactive, and personalized courses. By leveraging AI, Tenzzen converts raw video data and user-specified topics into coherent learning paths with modules, lessons, and assessments, empowering learners to efficiently absorb complex concepts.

## 2. Technology Stack

### Core

- **Frontend Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Backend / Database**: Convex (Realtime Database, Serverless Functions)
- **Authentication**: Clerk
- **AI Engine**: Vercel AI SDK with Google Gemini Models (`gemini-1.5-flash`, `gemini-1.5-pro`)
- **Package Manager**: pnpm (Required)

### UI & Styling

- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui (Radix UI based)
- **Theme**: next-themes (Dark/Light mode)

## 3. Architecture

### High-Level Flow

1.  **Input**: User provides a YouTube URL (video/playlist) or a topic.
2.  **Processing**: Server Actions (`actions/`) fetch metadata and invoke AI models.
3.  **AI Generation**: `lib/ai/client.ts` orchestrates calls to Google Gemini to generate course outlines, lessons, and quizzes.
4.  **Storage**: Structured data is stored in Convex (`convex/schema.ts`).
5.  **Presentation**: Next.js Server Components render the course, with Client Components for interactivity.

### Database Schema (Convex)

The database is schema-first, defined in `convex/schema.ts`. Key tables include:

- **users**: Manages user credits and profile metadata.
- **courses**: Stores course metadata (including trust scores, upvotes), structure, and settings.
- **modules**: Logical groupings of lessons.
- **lessons**: Individual learning units with content, video timestamps, and key points.
- **quizzes** & **quizQuestions**: AI-generated assessments.
- **user_enrollments** & **lesson_progress**: Tracks user progress.
- **videos** & **playlists**: Caches YouTube metadata.

### Key Directories

- `app/`: Next.js App Router pages and layouts.
- `convex/`: Backend schema, queries, and mutations.
- `actions/`: Server Actions for external API calls (YouTube, AI) and heavy processing.
- `lib/ai/`: AI client configuration, prompts, and types.
- `components/`: Reusable UI components.
- `hooks/`: Custom React hooks.

## 4. Key Features

### Course Generation Engine

- **YouTube Integration**: Analyzes single videos, playlists, or channels.
- **Topic-Based Generation**: Creates courses from text prompts.
- **Topic-Based Generation**: Creates courses from text prompts.
- **Transcript Analysis**: Extracts key concepts and timestamps from video transcripts.
- **Credit System**: Users spend credits to generate high-quality AI courses.

### Discovery & Community

- **Explore Page**: Trending, Top Rated, and New course feeds.
- **Trust Metrics**: Courses feature transparency scores and upvote counts.
- **Forking**: Users can clone and customize existing courses.

### Learning Experience

- **Interactive Player**: Custom video player with timestamp navigation.
- **Progress Tracking**: Granular tracking at the lesson and course level.
- **On-Demand Assessments**: Generate Quizzes (Multiple Choice), Tests (Open-Ended), and Projects (Capstone) for any lesson.
- **Notes**: Rich text note-taking capability (planned/in-progress).

### Dashboard

- **My Courses**: Manage enrolled and generated courses.
- **Analytics**: Track learning streaks and completion rates.

## 5. Setup & Development

### Prerequisites

- Node.js 18+
- pnpm
- Clerk Account (Publishable Key & Secret Key)
- Convex Account (Deployment URL)
- Google AI Studio Key (for Gemini)
- YouTube Data API Key

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Set up environment variables in `.env.local` (see `SETUP.md` or `../README.md`).
4.  Start the Convex dev server:
    ```bash
    pnpm convex
    ```
5.  Start the Next.js dev server:
    ```bash
    pnpm dev
    ```

## 6. Deployment

The application is optimized for deployment on **Vercel**.

- **Build Command**: `next build`
- **Install Command**: `pnpm install --no-frozen-lockfile`
- **Environment Variables**: Ensure all keys (Clerk, Convex, YouTube, Google AI) are set in the Vercel dashboard.

See `DEPLOYMENT.md` for detailed instructions.
