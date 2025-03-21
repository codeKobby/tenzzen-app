# Assessment System Setup

## Prerequisites

1. Node.js (v18 or higher)
2. pnpm (recommended) or npm
3. Convex account
4. OpenAI API key

## Installation

```bash
# Install dependencies
pnpm install

# Install Convex CLI globally (if not already installed)
pnpm add -g convex
```

## Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
OPENAI_API_KEY=your_openai_api_key
```

## Development

1. Start Convex development server:
```bash
convex dev
```

2. In a new terminal, start Next.js development server:
```bash
pnpm dev
```

## Database Setup

Initialize Convex schema:

```bash
convex deploy
```

## Testing the System

1. Create a test course:
```bash
curl -X POST http://localhost:3000/api/courses/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "description": "A test course",
    "sections": [
      {
        "title": "Section 1",
        "lessons": [
          {
            "title": "Lesson 1",
            "content": "Test content"
          }
        ]
      }
    ]
  }'
```

2. Access the course interface:
```
http://localhost:3000/course/[courseId]
```

## Development Commands

```bash
# Run tests
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Build for production
pnpm build
```

## Common Issues

1. Convex Connection Issues
   ```bash
   # Check Convex status
   convex status
   
   # Reset Convex dev server
   convex dev --reset
   ```

2. Database Schema Sync
   ```bash
   # Force schema update
   convex deploy --force
   ```

3. OpenAI Rate Limits
   ```bash
   # Check API usage
   convex run getOpenAIUsage
   ```

## Project Structure

```
├── app/                 # Next.js app router
├── components/         
│   ├── assessment/     # Assessment components
│   └── ui/             # Shared UI components
├── convex/             # Backend functions
│   ├── schema.ts       # Database schema
│   ├── assessments.ts  # Assessment handlers
│   └── progress.ts     # Progress tracking
├── hooks/              # React hooks
├── lib/                # Utility functions
└── types/              # TypeScript types
```

## Deployment

1. Deploy Convex functions:
```bash
convex deploy
```

2. Deploy Next.js app to Vercel:
```bash
vercel
```

## Monitoring

1. Check Convex logs:
```bash
convex logs
```

2. Monitor assessment generation:
```bash
convex dashboard
```

## Documentation

- [Assessment System](./assessment-system.md)
- [API Documentation](./api.md)
- [Component Library](./components.md)

## Support

For issues:
1. Check the [troubleshooting guide](./troubleshooting.md)
2. Open an issue on GitHub
3. Contact support team

## Updates

To update dependencies:
```bash
pnpm update
convex deploy