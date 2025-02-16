# Playlist Management in LearnFlow

## Overview

The playlist feature allows users to organize educational videos into collections for better learning management. This document explains the implementation details and database schema.

## Database Schema

### Playlists Table

```sql
create table public.playlists (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  video_ids text[] default '{}' not null,
  user_id uuid references auth.users not null
);

-- Create index for faster user-specific queries
create index playlists_user_id_idx on public.playlists(user_id);

-- Row Level Security (RLS) policies
alter table public.playlists enable row level security;

-- Users can only read their own playlists
create policy "Users can view own playlists" on playlists
  for select using (auth.uid() = user_id);

-- Users can insert their own playlists
create policy "Users can create playlists" on playlists
  for insert with check (auth.uid() = user_id);

-- Users can update their own playlists
create policy "Users can update own playlists" on playlists
  for update using (auth.uid() = user_id);

-- Users can delete their own playlists
create policy "Users can delete own playlists" on playlists
  for delete using (auth.uid() = user_id);
```

## Frontend Components

### PlaylistManager

- **Purpose**: Modal component for creating new playlists and adding videos to existing ones
- **Key Features**:
  - Create new playlists
  - Add videos to existing playlists
  - Loading states and error handling
  - Real-time updates
- **File**: `frontend/src/components/PlaylistManager.tsx`

### PlaylistSidebar

- **Purpose**: Persistent sidebar showing user's playlists and their contents
- **Key Features**:
  - Expandable playlist sections
  - Quick video access
  - Loading states
  - Error handling
- **File**: `frontend/src/components/PlaylistSidebar.tsx`

## State Management

We use React's built-in state management with hooks for local component state:

- `useState` for component-level state
- `useEffect` for data fetching and side effects
- Context API (via `AuthContext`) for user authentication state

### Key State Objects

```typescript
// Playlist type from database
interface DBPlaylist {
  id: string;
  created_at: string;
  name: string;
  video_ids: string[];
  user_id: string;
}

// Component state examples
const [playlists, setPlaylists] = useState<DBPlaylist[]>([]);
const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(
  new Set()
);
```

## Data Flow

1. User clicks "Save to Playlist" on a video
2. PlaylistManager modal opens
3. Component fetches user's playlists from Supabase
4. User can:
   - Create a new playlist (inserts new row)
   - Add to existing playlist (updates video_ids array)
5. UI updates optimistically while changes are saved
6. PlaylistSidebar reflects changes in real-time

## Security Considerations

1. Row Level Security (RLS) ensures users can only access their own playlists
2. All database operations require authentication
3. Input validation on both client and server
4. Environment variables for sensitive credentials
5. Type checking with TypeScript

## Error Handling

We implement comprehensive error handling:

```typescript
try {
  const data = await getUserPlaylists(userId);
  setPlaylists(data);
} catch (err) {
  setError("Failed to load playlists");
  console.error(err);
} finally {
  setIsLoading(false);
}
```

## Future Improvements

1. Playlist sharing capabilities
2. Collaborative playlists
3. Playlist analytics
4. Offline support
5. Video metadata caching
6. Drag-and-drop reordering
7. Batch operations

## Learning Resources

To better understand the implementation:

1. React Concepts:

   - [React State and Lifecycle](https://react.dev/learn/state-and-lifecycle)
   - [Using the Effect Hook](https://react.dev/reference/react/useEffect)

2. Supabase:

   - [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
   - [Database Functions](https://supabase.com/docs/guides/database/functions)

3. TypeScript:
   - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
   - [Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
