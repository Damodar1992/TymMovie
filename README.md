# TymMovie — Shared Movie Tracker

Single frontend project (React + Vite) with **Vercel Serverless API** that talks directly to **Neon PostgreSQL** and **The Movie DB (TMDB)**. No separate backend server.

## Stack

- **Frontend:** React, TypeScript, Vite, React Query, Axios
- **API:** Vercel serverless functions in `frontend/api/` (Neon + TMDB)
- **DB:** Neon PostgreSQL (table `movies` — see `frontend/schema.sql`)
- **Metadata:** TMDB (posters, genres, rating by title)

## Setup

1. **Clone and install**
   ```bash
   cd frontend && npm install
   ```

2. **Environment**
   - Copy `frontend/.env.example` to `frontend/.env`
   - Set `DATABASE_URL` (Neon) and `TMDB_API_KEY` (Bearer token)

3. **Database**
   - In Neon SQL Editor, run `frontend/schema.sql` to create the `movies` table (if needed).

4. **Local dev** (Vite + local API server on http://localhost:5173)
   - Ensure `frontend/.env` exists with `DATABASE_URL` and `TMDB_API_KEY`.
   ```bash
   cd frontend && npm run dev
   ```
   This runs **Vite** (frontend) and a **Node API server** (same handlers as in `api/`). No Vercel locally.  
   Frontend only (no API): `npm run dev:only`.

5. **Deploy**
   - Connect the repo to Vercel, set **Root Directory** to `frontend`.
   - Add env vars: `DATABASE_URL`, `TMDB_API_KEY`.
   - Deploy. See [VERCEL.md](./VERCEL.md) for details.

## Project layout

- `frontend/` — React app + Vercel API
  - `src/` — React components, pages, API client
  - `api/` — serverless routes: `/api/movies`, `/api/movies/enrich`, `/api/movies/[id]`
  - `lib/` — db (Neon) and tmdb helpers (server-side only, used by `api/`)

The old NestJS backend has been removed; all logic lives in the frontend repo and serverless API.
