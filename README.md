## TymMovies — Shared Movie & TV Tracker

React (Vite) frontend backed by small Vercel serverless functions that talk to:
- **Neon PostgreSQL** (`users`, `lists`, `list_members`, `list_movies`, `list_movie_ratings`,
  `list_invites`, and a shared `movies` catalog — see `frontend/migrations/`)
- **TMDb** (search, details, images)
- **Google OAuth 2.0** for sign-in

Personal/family project for tracking what to watch and rating what's been watched — now built for
multiple users, each with their own list(s), who can invite others into a shared list via a link.

### Stack

- **Frontend:** React, TypeScript, Vite, React Query
- **Backend:** Vercel serverless functions (`frontend/api/`) — no separate server to run/deploy
- **DB:** Neon PostgreSQL, accessed only from the serverless functions via `DATABASE_URL`
- **Metadata:** TMDb multi-search + movie/TV details, cached into a shared local catalog so the
  same title is never fetched from TMDb twice (see "Catalog-first search" below)
- **Auth:** Google OAuth 2.0 (any Google account may sign in — no allowlist), backed by a signed,
  httpOnly session cookie checked server-side on every write

### How multi-user works

- Any user can sign in with Google. On first sign-in they get their own personal list.
- A list **owner** can generate a shareable invite **link** (`/invite/:token`, no expiry until
  revoked). Anyone who opens it and signs in with Google joins that list.
- Everyone in a list sees the same movies, and each member's own rating for each title. The list
  owner can also set a rating on behalf of any member of that list (e.g. to enter a rating that was
  given verbally) — this is recorded internally (`rated_by`) but not surfaced in the UI.
- A user can belong to several lists (their own, plus any shared with them) and switch between them
  from the list switcher in the header.
- Currently every member of a list can add/edit/remove movies and change status/dates. A
  read-only "viewer" role exists in the data model for a future invite type but isn't offered yet.

### Catalog-first search

`GET /api/search` searches the local `movies` catalog first; TMDb is only called as a fallback when
local results are sparse. Adding a movie resolves it against the catalog (by TMDb id) and only calls
the TMDb details endpoint if that title has never been cached before — the TMDb API key never
reaches the browser, and the same title is fetched from TMDb once, no matter how many users add it
to their lists.

### Setup

1. **Clone and install**
   ```bash
   cd frontend && npm install
   ```

2. **Google OAuth client** — in [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an OAuth 2.0 **Web application** client. Add an authorized redirect URI for each
   environment you'll use, e.g. `http://localhost:5173/api/auth/google-callback` for local dev and
   `https://your-app.vercel.app/api/auth/google-callback` for production.

3. **Environment** — copy `frontend/.env.example` to `frontend/.env` and fill in:
   - `DATABASE_URL` — Neon connection string
   - `TMDB_API_KEY` — TMDb bearer token
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from the OAuth client above
   - `GOOGLE_REDIRECT_URI` — must exactly match one of that client's authorized redirect URIs
   - `AUTH_SECRET` — a long random string used to sign session cookies (e.g. `openssl rand -base64 32`)

   None of these are prefixed with `VITE_` — they're only read server-side, in `frontend/api/`.

4. **Database** — apply the schema with the migration runner:
   ```bash
   cd frontend && npm run migrate
   ```
   This runs each file in `frontend/migrations/` once (tracked in a `_migrations` table), so it's
   safe to run again after pulling new migrations.

5. **Local dev** — just the usual:
   ```bash
   cd frontend && npm run dev
   ```
   A dev-only Vite plugin (`frontend/dev-api-plugin.ts`) serves `frontend/api/*` on the same port
   as the React app and loads `frontend/.env` into `process.env`, so the API routes work locally
   without the Vercel CLI or a Vercel account. It never runs during `npm run build` — Vercel builds
   and serves `api/*` independently in production, using the exact same handler files.

   Note: session cookies are only marked `Secure` when `process.env.VERCEL` is set (i.e. on an
   actual Vercel deployment), since a `Secure` cookie is silently refused by the browser over plain
   `http://localhost`.

6. **Deploy**
   - Connect the repo to Vercel, set **Root Directory** to `frontend`.
   - Build command: `npm run build`, Output: `dist` (Vercel auto-detects and deploys `api/` alongside it).
   - Add the env vars listed above in the Vercel project settings (Production and Preview) — remember
     to add a `GOOGLE_REDIRECT_URI` (and matching authorized redirect URI on the Google client) for
     each Vercel environment/domain you actually use.
   - `frontend/vercel.json` rewrites non-API routes to `index.html` so the SPA works on refresh.

### Project layout

- `frontend/api/` — Vercel serverless functions (the only code that touches `DATABASE_URL` / `TMDB_API_KEY`)
  - `_lib/db.ts`, `_lib/tmdb.ts`, `_lib/google.ts`, `_lib/auth.ts` — shared server-side logic
  - `auth/` — Google OAuth start/callback, session, logout
  - `lists/` — lists, members, invites, and the movies/ratings within a list
  - `invites/` — public invite preview + accept
  - `search/` — catalog-first movie/TV search
- `frontend/migrations/` — numbered SQL migrations, applied via `npm run migrate`
- `frontend/scripts/backfill-lists.mjs` — one-off script for migrating pre-multi-user data (the old
  single shared `movies` table with `inna_rating`/`bogdan_rating` columns) into the new
  `lists`/`list_members`/`list_movie_ratings` model. Not part of `npm run migrate`; run manually.
- `frontend/src/` — React components, catalog page, hooks
- `frontend/src/api/` — client-side hooks/wrappers that call `frontend/api/*` over HTTP

> **Security note:** `DATABASE_URL`, `TMDB_API_KEY`, `GOOGLE_CLIENT_SECRET` and `AUTH_SECRET` never
> reach the browser. Sign-in is open to any Google account, but a new user only ever sees their own
> empty personal list — they see another user's list only after opening that owner's invite link.
