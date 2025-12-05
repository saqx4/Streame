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
  created_at timestamp with time zone default now()
);

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
  insert into public.profiles (id, username, avatar_url)
  values (new.id, split_part(new.email, '@', 1), null)
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
insert into public.profiles (id, username, avatar_url)
select id, split_part(email, '@', 1), null
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
-- 6. GRANT PERMISSIONS
-- ============================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.user_media to anon, authenticated;
grant usage, select on sequence user_media_id_seq to anon, authenticated;

-- ============================================
-- 7. CLEAN UP OLD FAVORITE ENTRIES (optional)
-- ============================================
-- If you had favorites before, this removes them:
-- delete from public.user_media where list_type = 'favorite';

-- ============================================
-- 8. RELOAD POSTGREST SCHEMA CACHE
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
