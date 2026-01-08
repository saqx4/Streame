-- Migration script to add watch_history table
-- Run this in Supabase SQL Editor if you get errors with the main setup file

-- Drop the table if it exists (to start fresh)
drop table if exists public.watch_history cascade;

-- Create watch_history table
create table public.watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id integer not null,
  type text not null check (type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  duration integer,
  last_position integer, -- Playback position in seconds
  season_number integer,
  episode_number integer,
  last_watched timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, tmdb_id, type, season_number, episode_number)
);

-- Enable RLS
alter table public.watch_history enable row level security;

-- Create RLS policies
create policy "watch_history readable by owner" 
  on public.watch_history for select 
  using (auth.uid() = user_id);

create policy "watch_history insert by owner" 
  on public.watch_history for insert 
  with check (auth.uid() = user_id);

create policy "watch_history update by owner" 
  on public.watch_history for update 
  using (auth.uid() = user_id);

create policy "watch_history delete by owner" 
  on public.watch_history for delete 
  using (auth.uid() = user_id);

-- Create indexes
create index idx_watch_history_user_last_watched 
  on public.watch_history (user_id, last_watched desc);

create index idx_watch_history_user_tmdb_type 
  on public.watch_history (user_id, tmdb_id, type);

-- Grant permissions
grant select, insert, update, delete on public.watch_history to anon, authenticated;

-- Reload schema cache
notify pgrst, 'reload schema';
