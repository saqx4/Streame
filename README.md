# Streame

Streame is a modern streaming-style web app for discovering movies and TV shows, viewing details and trailers, and watching via third-party embed providers.

## Features

- Browse movies and TV shows
- Search across movies/TV
- Details pages with cast and recommendations
- Player pages for movies and episodes
- Auth (Supabase) with profile + watchlist
- Continue watching / watch history (Supabase)
- Toast notifications, skeleton loading, lazy image loading

## Tech Stack

- Vite + React + TypeScript
- React Router
- Supabase (Auth + DB)
- TMDB API (metadata)

## Local Development

1. Install dependencies

```bash
npm install
```

2. Create a local `.env` (copy from `.env.example`)

```bash
copy .env.example .env
```

3. Fill environment variables

Required:

- `VITE_TMDB_API_KEY`

Optional (enables auth, watchlist, continue watching):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)

4. Start dev server

```bash
npm run dev
```

## Production / Vercel

- SPA rewrites are configured in `vercel.json`.
- Security headers (including CSP) are also configured in `vercel.json`.

## SEO Files

`public/robots.txt` and `public/sitemap.xml` are included.

Important: replace `https://your-domain.com` with your real domain.

## Optional Telemetry

Telemetry is disabled by default and only activates when env vars are provided:

- `VITE_ANALYTICS_SCRIPT_URL`
- `VITE_ANALYTICS_DOMAIN`
- `VITE_ERROR_REPORT_ENDPOINT`
