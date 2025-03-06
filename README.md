# Tenzzen

A Next.js application with Convex backend and Clerk authentication.

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Convex
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- A Clerk account
- A Convex account

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd tenzzen
```

2. Install dependencies:
```bash
pnpm install
```

3. Environment Variables:
Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWT_ISSUER_DOMAIN=your_clerk_issuer_domain

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

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
