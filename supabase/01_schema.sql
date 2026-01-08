begin;

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

alter table public.user_media enable row level security;

create table if not exists public.user_progress (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id bigint not null,
  season integer not null,
  episode integer not null,
  updated_at timestamp with time zone default now(),
  unique (user_id, tmdb_id)
);

alter table public.user_progress enable row level security;

create table if not exists public.watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id integer not null,
  type text not null check (type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  duration integer,
  last_position integer,
  season_number integer,
  episode_number integer,
  last_watched timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, tmdb_id, type, season_number, episode_number)
);

alter table public.watch_history enable row level security;

create index if not exists idx_user_media_user_list_created
  on public.user_media (user_id, list_type, created_at desc);

create index if not exists idx_user_progress_user_tmdb
  on public.user_progress (user_id, tmdb_id);

create index if not exists idx_watch_history_user_last_watched
  on public.watch_history (user_id, last_watched desc);

create index if not exists idx_watch_history_user_tmdb_type
  on public.watch_history (user_id, tmdb_id, type);

commit;
