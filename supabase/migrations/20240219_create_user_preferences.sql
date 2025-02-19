-- Create user preferences table
create table if not exists public.user_preferences (
    user_id uuid references auth.users primary key,
    theme text not null default 'system',
    color_theme text check (color_theme in ('purple', 'neutral')),
    updated_at timestamptz default now(),
    created_at timestamptz default now()
);

-- Set up RLS policies
alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_preferences for select
  using ( auth.uid() = user_id );

create policy "Users can update own preferences"
  on public.user_preferences for update
  using ( auth.uid() = user_id );

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check ( auth.uid() = user_id );

-- Grant access to authenticated users
grant select, insert, update on public.user_preferences to authenticated;
