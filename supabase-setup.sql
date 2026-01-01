-- Complete Supabase setup for Streame app
-- Run this entire file in Supabase SQL Editor
-- 
-- FEATURES:
-- - Email/password authentication with Remember Me (stored in browser localStorage)
-- - Profile auto-creation on signup
-- - Watchlist functionality (favorites removed)
-- - Row Level Security (RLS) enabled
-- - Password reset via email

begin;

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  avatar_url text,
  avatar_color integer,
  created_at timestamp with time zone default now()
);

alter table public.profiles add column if not exists avatar_color integer;

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles are readable by owner') then
    create policy "profiles are readable by owner" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles insert for owner') then
    create policy "profiles insert for owner" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles update by owner') then
    create policy "profiles update by owner" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  begin
    execute 'set local role supabase_storage_admin';

    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true)
    on conflict (id) do update set public = true;

    execute 'alter table storage.objects enable row level security';

    execute 'drop policy if exists "Public read avatars" on storage.objects';
    execute 'create policy "Public read avatars" on storage.objects for select to public using (bucket_id = ''avatars'')';

    execute 'drop policy if exists "Users can upload own avatar" on storage.objects';
    execute 'create policy "Users can upload own avatar" on storage.objects for insert to authenticated with check (bucket_id = ''avatars'' and (storage.foldername(name))[1] = auth.uid()::text)';

    execute 'drop policy if exists "Users can update own avatar" on storage.objects';
    execute 'create policy "Users can update own avatar" on storage.objects for update to authenticated using (bucket_id = ''avatars'' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = ''avatars'' and (storage.foldername(name))[1] = auth.uid()::text)';

    execute 'drop policy if exists "Users can delete own avatar" on storage.objects';
    execute 'create policy "Users can delete own avatar" on storage.objects for delete to authenticated using (bucket_id = ''avatars'' and (storage.foldername(name))[1] = auth.uid()::text)';
  exception
    when insufficient_privilege then
      raise notice 'Skipping avatar Storage setup (not enough privileges). Run this script in Supabase SQL Editor as role postgres/service_role to enable avatars across devices.';
  end;
end $$;

-- ============================================
-- 2. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, avatar_color)
  values (new.id, split_part(new.email, '@', 1), null, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================
-- 3. BACKFILL EXISTING USERS INTO PROFILES
-- ============================================
insert into public.profiles (id, username, avatar_url, avatar_color)
select id, split_part(email, '@', 1), null, null
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ============================================
-- 4. USER_MEDIA TABLE (watchlist only)
-- ============================================
create table if not exists public.user_media (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id bigint not null,
  type text not null check (type in ('movie','tv')),
  title text not null,
  poster_path text,
  list_type text not null check (list_type in ('watchlist')),
  created_at timestamp with time zone default now(),
  unique (user_id, tmdb_id, list_type)
);

-- Enable RLS on user_media
alter table public.user_media enable row level security;

-- User_media RLS policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media readable by owner') then
    create policy "user_media readable by owner" on public.user_media for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media insert by owner') then
    create policy "user_media insert by owner" on public.user_media for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media update by owner') then
    create policy "user_media update by owner" on public.user_media for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_media' and policyname='user_media delete by owner') then
    create policy "user_media delete by owner" on public.user_media for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_user_media_user_list_created
  on public.user_media (user_id, list_type, created_at desc);

create unique index if not exists ux_user_media_user_tmdb_list
  on public.user_media (user_id, tmdb_id, list_type);

-- ============================================
-- 6. USER_PROGRESS TABLE (episode progress)
-- ============================================
create table if not exists public.user_progress (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id bigint not null,
  season integer not null,
  episode integer not null,
  updated_at timestamp with time zone default now(),
  unique (user_id, tmdb_id)
);

-- Enable RLS on user_progress
alter table public.user_progress enable row level security;

-- user_progress RLS policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_progress' and policyname='user_progress readable by owner') then
    create policy "user_progress readable by owner" on public.user_progress for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_progress' and policyname='user_progress upsert by owner') then
    create policy "user_progress upsert by owner" on public.user_progress for insert with check (auth.uid() = user_id);
    create policy "user_progress update by owner" on public.user_progress for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_progress' and policyname='user_progress delete by owner') then
    create policy "user_progress delete by owner" on public.user_progress for delete using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_user_progress_user_tmdb on public.user_progress (user_id, tmdb_id);

-- ============================================
-- 7. WATCH_HISTORY TABLE (Continue Watching)
-- ============================================
create table if not exists public.watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id integer not null,
  type text not null check (type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  duration integer,
  season_number integer,
  episode_number integer,
  last_watched timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, tmdb_id, type, season_number, episode_number)
);

-- Enable RLS on watch_history
alter table public.watch_history enable row level security;

-- watch_history RLS policies
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history readable by owner') then
    create policy "watch_history readable by owner" on public.watch_history for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history insert by owner') then
    create policy "watch_history insert by owner" on public.watch_history for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history update by owner') then
    create policy "watch_history update by owner" on public.watch_history for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='watch_history' and policyname='watch_history delete by owner') then
    create policy "watch_history delete by owner" on public.watch_history for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Indexes for watch_history performance
create index if not exists idx_watch_history_user_last_watched 
  on public.watch_history (user_id, last_watched desc);

create index if not exists idx_watch_history_user_tmdb_type 
  on public.watch_history (user_id, tmdb_id, type);

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.user_media to anon, authenticated;
grant select, insert, update, delete on public.user_progress to anon, authenticated;
grant select, insert, update, delete on public.watch_history to anon, authenticated;
grant usage, select on sequence user_media_id_seq to anon, authenticated;

-- ============================================
-- 9. CLEAN UP OLD FAVORITE ENTRIES (optional)
-- ============================================
-- If you had favorites before, this removes them:
-- delete from public.user_media where list_type = 'favorite';

-- ============================================
-- 10. RELOAD POSTGREST SCHEMA CACHE
-- ============================================
notify pgrst, 'reload schema';

commit;

-- ============================================
-- VERIFICATION QUERIES (run these after)
-- ============================================
-- Check tables exist:
-- select to_regclass('public.profiles');
-- select to_regclass('public.user_media');

-- Check your profile exists:
-- select id, username from public.profiles;

-- Check policies:
-- select schemaname, tablename, policyname from pg_policies where tablename in ('profiles', 'user_media');
