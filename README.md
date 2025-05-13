# Tenzzen App

A Next.js application that converts video content into structured courses using AI.

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/tenzzen-app.git
cd tenzzen-app
```

2. Install dependencies
```bash
pnpm install
```

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
```bash
pnpm dev
```

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

## Development

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
