# Tenzzen AI Agent Instructions

## Project Overview

Tenzzen is a **Next.js 15 App Router** application with **Convex** backend, **Clerk** authentication, and **Vercel AI SDK + Google Gemini** for generating courses from YouTube content. The project emphasizes schema-first, TypeScript-driven development with pnpm workspaces.

### Key Technologies
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Convex (real-time database + serverless functions)  
- **Auth**: Clerk with JWT integration
- **AI**: Vercel AI SDK + Google Gemini (`@ai-sdk/google`)
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **Package Manager**: pnpm (required, never use npm/yarn)

## Development Commands

### Core Commands
```bash
# Required startup sequence
pnpm install          # Install dependencies (pnpm only)
pnpm convex           # Start Convex dev server (must run first)
pnpm dev              # Start Next.js development server
pnpm dev:turbo        # Start with Turbopack (faster builds)

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm test             # Run Vitest tests
```

### Testing Commands
```bash
# Run all tests
pnpm test

# Run single test file
pnpm test tests/dashboard.spec.ts

# Watch mode for development
pnpm test --watch
```

### Engine Requirements
- Node.js: >=18.17.0
- pnpm: >=9.0.0

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** - All type checking enforced
- **Target**: ES2018 with **moduleResolution**: bundler
- **JSX**: React-JSX for modern React patterns
- **Path aliases**: Use `@/` prefix for all internal imports

### Import Conventions
```typescript
// React and Next.js imports first
import React from "react"
import { redirect } from "next/navigation"

// External libraries
import { z } from "zod"
import { convexHull } from "convex/server"

// Internal imports with path aliases
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "@/convex/_generated/api"
```

### Component Patterns
- **Default to Server Components** - Only add `"use client"` when necessary
- **Client Components Required For**:
  - React hooks (`useState`, `useEffect`, etc.)
  - Browser APIs (`window`, `document`)
  - Convex React hooks (`useQuery`, `useMutation`)
  - Event handlers (`onClick`, `onChange`)

### shadcn/ui Component Structure
```typescript
"use client" // Only when needed
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Naming Conventions
- **Components**: PascalCase (`Button`, `CourseCard`, `UserProfile`)
- **Files**: kebab-case for components (`button.tsx`, `course-card.tsx`)
- **Utilities**: camelCase (`formatDate`, `calculateProgress`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase with descriptive names (`CourseData`, `UserProfile`)

### Error Handling Patterns
```typescript
// Server Actions (in actions/ directory)
"use server"
import { z } from "zod"
import { ConvexError } from "convex/values"

const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
})

export async function createCourse(input: unknown) {
  try {
    const { title, description } = createCourseSchema.parse(input)
    // ... implementation
    return { success: true, courseId }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data" }
    }
    throw new ConvexError("Failed to create course")
  }
}

// Client Components
const CourseForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await createCourse(formData)
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }
}
```

### Convex Patterns
```typescript
// Schema (convex/schema.ts)
export default defineSchema({
  courses: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    sourceType: v.union(v.literal("youtube"), v.literal("manual")),
    sourceId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["createdBy"])
    .index("by_source", ["sourceType", "sourceId"]),
})

// Query
export const getCoursesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userId))
      .collect()
  },
})

// Mutation
export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    sourceType: v.union(v.literal("youtube"), v.literal("manual")),
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Not authenticated")
    
    return await ctx.db.insert("courses", {
      ...args,
      createdBy: identity.tokenIdentifier,
      createdAt: Date.now(),
    })
  },
})
```

### Styling Guidelines
- **CSS Variables**: Use HSL with CSS variables for theme colors
  ```css
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  ```
- **Tailwind Classes**: Prefer utility classes over custom CSS
- **Responsive Design**: Use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- **Dark Mode**: Support via `next-themes` and `dark:` class variants

### ESLint Configuration (Relaxed Rules)
```json
{
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": "off", 
  "react-hooks/rules-of-hooks": "off",
  "react-hooks/exhaustive-deps": "off",
  "prefer-const": "off"
}
```

## Architecture Patterns

### Directory Structure
```
├── app/                    # Next.js App Router pages
├── components/            # React components (shadcn/ui + custom)
├── convex/               # Convex backend (schema, queries, mutations)
├── actions/              # Server Actions (server-only with "use server")
├── lib/                  # Utilities and helpers
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
└── tests/                # Test files
```

### Server/Client Component Split
- **Server Components**: Default choice for better performance
- **Client Components**: Only when needed for hooks, browser APIs, or Convex React hooks
- **Server Actions**: Files in `actions/` start with `"use server"` and can call Convex server APIs directly

### Authentication Flow
- **Clerk**: Handles authentication site-wide
- **JWT Integration**: See `convex/auth.config.ts`
- **Onboarding**: `middleware.ts` enforces onboarding via Clerk metadata
- **User Identity**: Use `getUserIdentity` in Convex functions, Clerk hooks on client

### AI Integration Flow
```
YouTube URL → Fetch Data → AI Generation → Store in Convex → Display Course
```

## Repository-Specific Rules

1. **pnpm only**: Never use npm/yarn for any operations
2. **Convex-first**: All data flows through Convex; always ensure queries are indexed
3. **Server Actions**: Use `actions/` directory for server-only operations
4. **Component Split**: Default to Server Components, add `"use client"` only when necessary
5. **Schema Updates**: When adding new queryable fields, update `convex/schema.ts` and add indexes
6. **Path Aliases**: Use `@/` imports consistently (configured in `tsconfig.json`)

## Key Files to Inspect

- `app/ConvexClientProvider.tsx` - Provider wiring (Clerk + Convex JWT flow)
- `convex/schema.ts` - Database schema and indexes (required for queries)
- `actions/generateCourseFromYoutube.ts` - Server Action example for AI generation
- `lib/ai/client.ts` - AI client wrappers used by server actions
- `middleware.ts` - Global routing + onboarding enforcement
- `vitest.config.ts` - Test configuration with React support

## Testing Guidelines

- **Framework**: Vitest with React Testing Library
- **Setup**: `vitest.setup.ts` imports `@testing-library/jest-dom`
- **Environment**: jsdom for DOM testing
- **Test Files**: Use `.spec.ts` or `.test.ts` extensions
- **Location**: Place tests in `tests/` directory or co-located with components

When making changes, always run `pnpm lint` to ensure code quality. If adding new database queries, update `convex/schema.ts` with appropriate indexes for performance.