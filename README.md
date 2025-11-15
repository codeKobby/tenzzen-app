<<<<<<< HEAD
# Tenzzen App

A Next.js application that converts video content into structured courses using AI.
=======
# Tenzzen

A Next.js application with Convex backend and Clerk authentication.

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Convex
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
>>>>>>> master

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/tenzzen-app.git
cd tenzzen-app
```

<<<<<<< HEAD
2. Install dependencies
=======
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
>>>>>>> master
```bash
pnpm install
```

<<<<<<< HEAD
3. Configure environment variables
```bash
# Copy the example environment file
cp .env.example .env
```

4. Set up Google Cloud and Vertex AI:

a. Create a Google Cloud Project
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project or select an existing one
- Note down your project ID

b. Enable required APIs
- Vertex AI API
- YouTube Data API v3

c. Create a Service Account
- Go to IAM & Admin > Service Accounts
- Create a new service account
- Grant it the following roles:
  - `Vertex AI User`
  - `Service Account User`
- Create and download a JSON key
- Copy the values from the JSON key to your .env file:
  - `client_email` → GOOGLE_CLIENT_EMAIL
  - `private_key` → GOOGLE_PRIVATE_KEY
  - `private_key_id` → GOOGLE_PRIVATE_KEY_ID

d. Set project and location
```env
GOOGLE_VERTEX_PROJECT=your-project-id
GOOGLE_VERTEX_LOCATION=us-central1
```

5. Set up Supabase:

a. Create a Supabase project at [Supabase](https://supabase.com)
b. Get your Supabase URL and anon key from the project settings
c. Add them to your .env file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
d. Set up the `execute_sql` function in Supabase:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the SQL from `sql/execute_sql_function.sql` in this repository
   - Run the SQL to create the function

6. Set up Clerk:
a. Create a Clerk project at [Clerk](https://clerk.dev)
b. Get your Clerk publishable key and secret key
c. Add them to your .env file:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```
d. Create a JWT template named "supabase" in your Clerk dashboard with the following claims:
```json
{
  "sub": "{{user.id}}",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.primary_email_address_verification.status}}"
}
```

7. Run the setup script
```bash
pnpm setup
```

The script will verify your environment configuration and guide you through any missing steps.

8. Start the development server
=======
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
>>>>>>> master
```bash
pnpm dev
```

<<<<<<< HEAD
## Features

- Video content analysis
- AI-powered course generation
- Structured learning paths
- Interactive progress tracking
- Resource curation

## Architecture

The application uses:
- Next.js 14 with App Router
- Vertex AI for course generation
- YouTube API for video data
- Edge Runtime for optimal performance
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI for components
=======
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
>>>>>>> master

## Features

- User authentication with Clerk
- Real-time data synchronization with Convex
- Video metadata management
- YouTube data integration

## Development

<<<<<<< HEAD
### Project Structure
```
├── actions/          # Server actions
├── app/             # Next.js app router
├── components/      # React components
├── hooks/           # Custom hooks
├── lib/            # Utilities and services
├── public/         # Static assets
├── scripts/        # Setup and utility scripts
├── types/          # TypeScript definitions
└── tools/          # Generation tools
```

### Key Features
- Course Generation using Vertex AI
- Video Content Analysis
- Progress Tracking
- Resource Management

## Environment Variables

Required environment variables:

```env
# Google Vertex AI
GOOGLE_VERTEX_PROJECT=your-project-id
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Key Here\n-----END PRIVATE KEY-----"
GOOGLE_PRIVATE_KEY_ID=your-key-id

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
=======
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
>>>>>>> master

## License

This project is licensed under the MIT License - see the LICENSE file for details.
