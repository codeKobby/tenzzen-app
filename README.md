# Tenzzen - AI-Powered Course Generation Platform

Transform YouTube videos into structured learning experiences with AI.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Google OAuth credentials (for Google sign-in)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file in the root directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Configure Supabase Authentication:
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Enable Email/Password provider
   - Enable Google provider and add your OAuth credentials
   - Add your app's URL to the redirect URLs (e.g., `http://localhost:3000/auth/callback`)

4. Start the development server:
```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

### Authentication Features

- Email/Password authentication
- Google OAuth sign-in
- Password strength validation
- Protected routes
- Authentication state management
- Loading states
- Form validation

### Theme Support

- Light/Dark mode support
- System theme detection
- Theme persistence

### Project Structure

```
tenzzen/
├── app/
│   ├── (app)/          # Protected routes
│   ├── (auth)/         # Authentication routes
│   └── layout.tsx      # Root layout
├── components/         # Reusable components
├── lib/               # Utilities and providers
│   ├── supabase/      # Supabase client and auth
│   └── utils.ts       # Helper functions
└── public/            # Static assets
```

## Development

### Key Features

- Course generation from YouTube videos
- Progress tracking
- Interactive learning paths
- Responsive design
- Mobile-first approach

### Built With

- Next.js 13+ (App Router)
- React
- TypeScript
- Tailwind CSS
- Supabase
- shadcn/ui
