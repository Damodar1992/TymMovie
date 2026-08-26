## TymMovie — Shared Movie & TV Tracker

React (Vite) frontend backed by small Vercel serverless functions that talk to:
- **Neon PostgreSQL** (one `movies` table, see `frontend/migrations/`)
- **TMDb** (search, details, images)

Personal/family project for tracking what to watch and rating what's been watched.

### Stack

- **Frontend:** React, TypeScript, Vite, React Query
- **Backend:** Vercel serverless functions (`frontend/api/`) — no separate server to run/deploy
- **DB:** Neon PostgreSQL, accessed only from the serverless functions via `DATABASE_URL`
- **Metadata:** TMDb multi-search + movie/TV details, proxied through `/api/tmdb/*`
- **Auth:** a single admin login/password plus a read-only "guest" mode, both backed by a signed, httpOnly session cookie checked server-side on every write

### Why a backend now

Earlier versions of this app queried Neon and TMDb directly from the browser using `VITE_`-prefixed
env vars. That's simple, but it ships the database connection string and the TMDb API key inside the
JS bundle — anyone who opens devtools on the deployed site can read them. The small API layer in
`frontend/api/` exists specifically to keep those secrets server-side; the admin password is also now
checked on the server (via a signed session cookie) instead of being a literal string compared in
client-side JS.

### Setup

1. **Clone and install**
   ```bash
   cd frontend && npm install
   ```

2. **Environment** — copy `frontend/.env.example` to `frontend/.env` and fill in:
   - `DATABASE_URL` — Neon connection string
   - `TMDB_API_KEY` — TMDb bearer token
   - `ADMIN_LOGIN` / `ADMIN_PASSWORD` — credentials for the admin login screen
   - `AUTH_SECRET` — a long random string used to sign session cookies (e.g. `openssl rand -base64 32`)

   None of these are prefixed with `VITE_` — they're only read server-side, in `frontend/api/`.

3. **Database** — apply the schema with the migration runner:
   ```bash
   cd frontend && npm run migrate
   ```
   This runs each file in `frontend/migrations/` once (tracked in a `_migrations` table), so it's
   safe to run again after pulling new migrations.

4. **Local dev** — just the usual:
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

5. **Deploy**
   - Connect the repo to Vercel, set **Root Directory** to `frontend`.
   - Build command: `npm run build`, Output: `dist` (Vercel auto-detects and deploys `api/` alongside it).
   - Add the env vars listed above in the Vercel project settings (Production and Preview).
   - `frontend/vercel.json` rewrites non-API routes to `index.html` so the SPA works on refresh.

### Project layout

- `frontend/api/` — Vercel serverless functions (the only code that touches `DATABASE_URL` / `TMDB_API_KEY`)
  - `_lib/db.ts`, `_lib/tmdb.ts`, `_lib/auth.ts` — shared server-side logic
  - `auth/`, `movies/`, `tmdb/` — HTTP route handlers
- `frontend/migrations/` — numbered SQL migrations, applied via `npm run migrate`
- `frontend/src/` — React components, catalog page, hooks
- `frontend/src/api/` — client-side hooks/wrappers that call `frontend/api/*` over HTTP

> **Security note:** With the API layer in place, `DATABASE_URL`, `TMDB_API_KEY`, `ADMIN_PASSWORD`
> and `AUTH_SECRET` never reach the browser. This is still a small, single-admin app meant for
> personal/family use, not a general-purpose multi-tenant product — but it's no longer handing out
> live database credentials to anyone who opens the network tab.
