# Implementation Plan for Tenzzen App

## Repository Root
C:\Users\kgeor\OneDrive\Desktop\Code\tenzzen-app

## Documentation Summary
### PROJECT_OVERVIEW.md
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


### DESIGN_SYSTEM.md
# Tenzzen Design System

## Core Theme Principles

### 1. Theme Configuration
- All components MUST use CSS variables defined in theme config
- Both light and dark themes MUST be supported
- System theme detection MUST be implemented
- Theme switching MUST be smooth and accessible

### 2. Color Tokens
| Token Name | Light Theme | Dark Theme | Usage |
|------------|-------------|------------|-------|
| background | `hsl(0 0% 100%)` | `hsl(224 71.4% 4.1%)` | Page backgrounds |
| foreground | `hsl(224 71.4% 4.1%)` | `hsl(210 20% 98%)` | Primary text |
| card | `hsl(0 0% 100%)` | `hsl(224 71.4% 4.1%)` | Card backgrounds |
| muted | `hsl(220 14.3% 95.9%)` | `hsl(215 27.9% 16.9%)` | Subtle backgrounds |
| primary | `hsl(262.1 83.3% 57.8%)` | `hsl(263.4 70% 50.4%)` | Primary actions |
| secondary | `hsl(220 14.3% 95.9%)` | `hsl(215 27.9% 16.9%)` | Secondary elements |
| border | `hsl(220 13% 91%)` | `hsl(215 27.9% 16.9%)` | Borders |
| ring | `hsl(262.1 83.3% 57.8%)` | `hsl(263.4 70% 50.4%)` | Focus rings |

### 3. Typography
- Font Family: Inter
- Base size: 16px (1rem)
- Scale:
  ```css
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  ```

### 4. Spacing
```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem;  /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem;    /* 16px */
--space-6: 1.5rem;  /* 24px */
--space-8: 2rem;    /* 32px */
--space-12: 3rem;   /* 48px */
--space-16: 4rem;   /* 64px */
```

## Component Library

### 1. Core Components

#### Button
```tsx
<Button
  variant="default" // default | destructive | outline | secondary | ghost | link
  size="default"    // default | sm | lg | icon
  className="..."   // custom classes
>
  Button Text
</Button>
```

Dark Theme Support:
```css
.button {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
  @apply dark:hover:bg-primary/80;
}
```

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

Dark Theme Support:
```css
.card {
  @apply bg-card text-card-foreground border;
  @apply dark:border-gray-800;
}
```

### 2. Form Components

#### Input
```tsx
<Input
  type="text"
  placeholder="Enter text"
  className="..."
/>
```

Dark Theme Support:
```css
.input {
  @apply bg-background border-input;
  @apply dark:bg-gray-950 dark:border-gray-800;
}
```

#### Select
```tsx
<Select>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem>Option</SelectItem>
  </SelectContent>
</Select>
```

### 3. Feedback Components

#### Alert
```tsx
<Alert variant="default">
  <AlertTitle>Title</AlertTitle>
  <AlertDescription>Description</AlertDescription>
</Alert>
```

#### Toast
```tsx
toast({
  title: "Title",
  description: "Description",
  variant: "default"
})
```

## Implementation Rules

### 1. Theme Integration
- MUST use `useTheme` hook for theme switching
- MUST implement dark mode variants
- MUST support system theme preference
- MUST provide smooth theme transitions

### 2. Component Usage
- MUST use shadcn components from `@/components/ui`
- MUST include proper dark mode classes
- MUST handle loading states with Skeleton
- MUST implement focus states

### 3. Responsive Design
- MUST use Tailwind breakpoints
- MUST support both light and dark themes at all sizes
- MUST maintain contrast ratios in both themes

### 4. Accessibility
- MUST maintain WCAG 2.1 AA compliance
- MUST support keyboard navigation
- MUST include proper ARIA attributes
- MUST ensure sufficient color contrast in both themes

## Style Enforcement

### 1. CSS Rules
- NO custom colors outside theme tokens
- NO direct CSS except for complex animations
- MUST use CSS variables for theme values
- MUST include dark mode variants

### 2. Component Rules
- ALL components must extend from shadcn base
- ALL interactive elements must have hover/focus states
- ALL components must support both themes
- NO inline styles

### 3. Theme Rules
- MUST use theme context for state
- MUST persist theme preference
- MUST support system preference
- MUST implement smooth transitions

This design system ensures consistent styling and proper theme support across the application.

## Web Design Inspiration
Web search results for "modern web app design patterns" (placeholder).

## Suggested Architecture
- Use Next.js App Router for pages.
- Leverage Convex for backend data and functions.
- Organize UI components under `components/` with a design system.
- Apply modern UI/UX patterns such as glassmorphism, dark mode, and micro‑animations.

## Next Steps
1. Refine the architecture diagram.
2. Break down tasks into granular tickets.
3. Implement UI components following the design inspiration.
