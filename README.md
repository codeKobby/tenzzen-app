# Tenzzen

A Next.js application with Convex backend and Clerk authentication.

## Documentation

For a comprehensive overview of the project, features, and architecture, please see [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md).

For deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Quick Start

1.  **Install dependencies**:

    ```bash
    pnpm install
    ```

2.  **Start Convex**:

    ```bash
    pnpm convex
    ```

3.  **Start Next.js**:
    ```bash
    pnpm dev
    ```

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Convex
- **Authentication**: Clerk
- **AI**: Vercel AI SDK (Google Gemini)
- **Styling**: Tailwind CSS + shadcn/ui

4. Initialize Convex:

```bash
npx convex dev
```

5. Start the development server:

```bash
pnpm dev
```

### Clerk Setup

1. Create a new application in [Clerk Dashboard](https://dashboard.clerk.dev)
2. Configure your OAuth providers (if needed)
3. Create a JWT template for Convex:
   - Go to JWT Templates in Clerk Dashboard
   - Create a new template with name "convex"
   - Use the default configuration

### Convex Setup

1. Initialize Convex in your project:

```bash
npx convex init
```

2. The schema and authentication are already configured in:

- `convex/schema.ts`: Database schema
- `convex/auth.config.ts`: Authentication configuration
- `convex/videos.ts`: API endpoints

### Project Structure

```
├── app/                    # Next.js app directory
├── components/            # React components
├── convex/               # Convex backend
│   ├── schema.ts        # Database schema
│   ├── auth.config.ts   # Auth configuration
│   └── videos.ts        # API endpoints
├── lib/                 # Utilities and helpers
├── public/              # Static assets
└── types/              # TypeScript types
```

## Features

- User authentication with Clerk
- Real-time data synchronization with Convex
- Video metadata management
- YouTube data integration

## Development

- Run `pnpm dev` to start the Next.js development server
- Run `npx convex dev` to start the Convex development server
- Visit `http://localhost:3000` to see your application

## Deployment

1. Deploy to Vercel:

```bash
vercel deploy
```

2. Deploy Convex:

```bash
npx convex deploy
```

3. Update environment variables in your Vercel deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.
