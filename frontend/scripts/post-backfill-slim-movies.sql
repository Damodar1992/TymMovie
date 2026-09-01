-- Run this MANUALLY (e.g. `psql "$DATABASE_URL" -f scripts/post-backfill-slim-movies.sql`)
-- once, and only once:
--   1. migrations 0004-0009 are applied (npm run migrate),
--   2. scripts/backfill-lists.mjs has run and its count check passed,
--   3. both real users have logged in via Google at least once.
-- Not a numbered migration on purpose — running it too early would drop
-- data that backfill-lists.mjs still needs to read.

ALTER TABLE movies DROP COLUMN IF EXISTS status;
ALTER TABLE movies DROP COLUMN IF EXISTS watch_date;
ALTER TABLE movies DROP COLUMN IF EXISTS inna_rating;
ALTER TABLE movies DROP COLUMN IF EXISTS bogdan_rating;
ALTER TABLE movies DROP COLUMN IF EXISTS user_avg_rating;
ALTER TABLE movies DROP COLUMN IF EXISTS comment_text;

-- No WHERE clause here on purpose: Postgres never treats two NULLs as
-- equal in a unique index, so plain rows with tmdb_id IS NULL are already
-- exempt from this constraint without needing a partial index. A partial
-- index (`WHERE tmdb_id IS NOT NULL`) would NOT be picked up by the
-- `ON CONFLICT (tmdb_id, content_type)` clause in _lib/db.ts's
-- upsertFromTmdb (Postgres only infers a partial unique index for
-- ON CONFLICT if the same WHERE predicate is repeated there), which is
-- exactly what caused "no unique or exclusion constraint matching the
-- ON CONFLICT specification" when adding a movie.
CREATE UNIQUE INDEX IF NOT EXISTS uq_movies_tmdb_id_content_type
  ON movies(tmdb_id, content_type);
