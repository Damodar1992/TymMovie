## TymMovie — Shared Movie & TV Tracker

Single **frontend-only** project (React + Vite) that talks **directly from the browser** to:
- **Neon PostgreSQL** (one `movies` table, see `frontend/schema.sql`)
- **TMDb** (search, details, images)

There is **no custom backend** and no serverless API layer — this is an intentional MVP architecture for personal/family use only.

### Stack

- **Frontend:** React, TypeScript, Vite, React Query
- **DB:** Neon PostgreSQL (direct access via `@neondatabase/serverless`)
- **Metadata:** TMDb multi-search + movie/TV details

### Setup

1. **Clone and install**
   ```bash
   cd frontend && npm install
   ```

2. **Environment**
   - Copy `frontend/.env.example` to `frontend/.env`
   - Set:
     - `VITE_DATABASE_URL` — Neon connection string (e.g. `postgresql://user:pass@host/db?sslmode=require`)
     - `VITE_TMDB_API_KEY` — TMDb bearer token / API key

3. **Database**
   - In Neon SQL Editor, run `frontend/schema.sql` to create the `movies` table and indexes exactly as required by the spec (supports movies + TV series in one table).

4. **Local dev** (React-only app on http://localhost:5173)
   ```bash
   cd frontend && npm run dev
   ```
   The app will connect directly from the browser to Neon and TMDb using the values from `.env`.

5. **Deploy**
   - Connect the repo to Vercel, set **Root Directory** to `frontend`.
   - Build command: `npm run build`, Output: `dist`.
   - Add env vars: `VITE_DATABASE_URL`, `VITE_TMDB_API_KEY`.
   - `frontend/vercel.json` rewrites all routes to `index.html` so the SPA works on refresh.

### Project layout

- `frontend/`
  - `src/` — React components, catalog page, hooks
  - `lib/db.ts` — Neon access layer (list/create/update/delete, duplicate detection)
  - `lib/tmdb.ts` — TMDb multi-search, details, image config, and URL builder
  - `schema.sql` — DDL for the `movies` table and indexes

> **Security note:** Because the app talks to Neon and TMDb directly from the browser, credentials are visible to users. This is acceptable only for personal, family, or MVP usage — not for a public production deployment.
