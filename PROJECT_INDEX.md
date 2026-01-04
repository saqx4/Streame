# Streame – Project Index

## Overview

A streaming-style React app for discovering movies/TV via TMDB and watching via third‑party embed providers. Optional Supabase integration provides auth, profiles, watchlist, and continue-watching/history.

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Supabase (optional): Auth + Postgres (RLS)
- Axios (TMDB requests)
- Vercel deployment config (SPA rewrites + security headers)

## Root Files

- `package.json`
  - `npm run dev` – start Vite dev server
  - `npm run build` – typecheck (`tsc -b`) + production build
  - `npm run preview` – preview production build
  - `npm run lint` – ESLint
- `vite.config.ts` – Vite config (base path `/`)
- `vercel.json` – deploy settings, SPA rewrite to `/index.html`, and security headers (incl. CSP)
- `.env.example` – environment variables template
- `supabase-setup.sql` – full Supabase schema + RLS policies
- `watch-history-migration.sql` – watch_history-only migration script
- `README.md` / `SETUP.md` – run instructions and feature overview

## Entry Points

- `index.html` – mounts app at `#root`, loads `/src/main.tsx`
- `src/main.tsx`
  - calls `initTelemetry()`
  - renders `<App />` via `createRoot(...).render(...)`
- `src/App.tsx`
  - sets up providers and React Router
  - pageview tracking via `trackPageView()` on route changes

## Routing (React Router)

Defined in `src/App.tsx`:

- `/` → `Home`
- `/movies` → `Movies`
- `/tv-shows` → `TVShows`
- `/search` → `Search`
- `/movie/:id` → `MovieDetail`
- `/tv/:id` → `TVShowDetail`
- `/watch/movie/:id` → `PlayerMovie`
- `/watch/tv/:tvId/season/:seasonNumber/episode/:episodeNumber` → `PlayerEpisode`
- `/view-all/:type/:category` → `ViewAll`
- `/login` → `Login`
- `/signup` → `Signup`
- `/forgot-password` → `ForgotPassword`
- `/reset-password` → `ResetPassword`
- `/settings` → `Settings`
- `/profile` → `ProtectedRoute(Profile)`
- `/watchlist` → `ProtectedRoute(Watchlist)`
- `*` → `NotFound`

## Main Source Folders

- `src/pages/`
  - Route-level pages (Home, details pages, player pages, auth pages, etc.)
- `src/components/`
  - Reusable UI components (navbar/footer, hero, media cards/rows, skeleton/loading, error boundary, continue watching, etc.)
- `src/services/`
  - `tmdb.ts` – TMDB API client + helpers (image URLs, streaming embed URL builder)
  - `userMedia.ts` – watchlist CRUD (Supabase table `user_media`)
  - `userProgress.ts` – TV episode progress (Supabase table `user_progress`)
  - `watchHistory.ts` – continue watching/history with offline queue + local cache (Supabase table `watch_history`)
- `src/context/`
  - `AuthContext.tsx` – auth state + auth actions (Supabase or local dev fallback)
  - `ThemeContext.tsx` – theme + blur settings (localStorage persisted)
  - `ToastContext.tsx` – global toasts
- `src/lib/`
  - `supabaseClient.ts` – creates Supabase client if env vars exist; otherwise provides a minimal mock to keep app running without Supabase
- `src/hooks/`
  - Player/UX hooks (wake lock, keyboard shortcuts, player events)
- `src/utils/`
  - Telemetry helpers (`initTelemetry`, `trackPageView`, `reportError`)
  - Misc helpers (`formatDuration`, `youtube`)

## Environment Variables

From `.env.example` / `README.md`:

- Required:
  - `VITE_TMDB_API_KEY`
- Optional (enables Supabase features):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
- Optional telemetry:
  - `VITE_ANALYTICS_SCRIPT_URL`
  - `VITE_ANALYTICS_DOMAIN`
  - `VITE_ERROR_REPORT_ENDPOINT`

## Supabase Schema (high level)

Defined in `supabase-setup.sql`:

- `public.profiles`
  - auto-created on signup via trigger `handle_new_user`
  - avatar storage bucket setup (if permissions allow)
- `public.user_media`
  - watchlist entries (`list_type = 'watchlist'`)
- `public.user_progress`
  - last watched season/episode per show
- `public.watch_history`
  - continue watching entries (progress %, duration, last_position, last_watched)

All tables have RLS policies so users can only read/write their own rows.

## Deployment

- Vercel:
  - build: `npm run build`
  - output: `dist/`
  - SPA rewrite configured in `vercel.json` so client routes work on refresh
  - security headers (incl. CSP) configured in `vercel.json`

## Quick Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`
