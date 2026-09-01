-- One-off, manual backfill + cleanup for the old single `movies` table
-- (with its inna_rating/bogdan_rating/status/watch_date/comment_text
-- columns) into the new lists/list_members/list_movies/list_movie_ratings
-- model. Pure SQL equivalent of scripts/backfill-lists.mjs +
-- scripts/post-backfill-slim-movies.sql, for running directly in the Neon
-- SQL Editor when a local Node connection isn't available.
--
-- Prerequisite: migrations 0004-0009 must already be applied (see
-- frontend/scripts/manual-migrate-0001-0009.sql if you ran those the same
-- way). Safe to re-run — every write is keyed/upserted the same way the
-- original Node script was, except the `movies_temp` backup and the
-- column-drop at the end, which only do anything the first time.
--
-- After this runs: Bohdan (owner) and Inna (member) exist as `users` rows
-- (google_sub still NULL — it gets filled in the moment each of them
-- actually signs in with Google using these exact email addresses), a
-- list called "Tymoshchuk" exists with both of them as members, every old
-- `movies` row has become a `list_movies` row in that list with the old
-- ratings carried over into `list_movie_ratings`, and `movies` itself is
-- back to being a clean shared catalog table (no personal columns).
-- `movies_temp` is an untouched full copy of the original table, kept as
-- a safety net — nothing in the app reads it; delete it whenever you're
-- confident you no longer need it.

BEGIN;

-- 1. Backup — exact copy of movies as it is right now, personal columns
--    and all. Left alone for the rest of this script and forever after.
CREATE TABLE IF NOT EXISTS movies_temp AS TABLE movies;

-- 2. Backfill: users, list, members, list_movies, list_movie_ratings —
--    read from movies_temp (identical to movies at this point, but makes
--    the intent explicit: this step never touches the live table).
DO $$
DECLARE
  v_owner_id UUID;
  v_member_id UUID;
  v_list_id UUID;
  v_list_movie_id UUID;
  m RECORD;
  v_list_movie_count INT := 0;
  v_rating_count INT := 0;
BEGIN
  -- Owner: Bohdan
  SELECT id INTO v_owner_id FROM users WHERE email = 'sleepless92@gmail.com';
  IF v_owner_id IS NULL THEN
    v_owner_id := gen_random_uuid();
    INSERT INTO users (id, email, name) VALUES (v_owner_id, 'sleepless92@gmail.com', 'Bohdan');
  ELSE
    UPDATE users SET name = 'Bohdan', updated_at = NOW() WHERE id = v_owner_id;
  END IF;

  -- Member: Inna
  SELECT id INTO v_member_id FROM users WHERE email = 'inna.bocharoff@gmail.com';
  IF v_member_id IS NULL THEN
    v_member_id := gen_random_uuid();
    INSERT INTO users (id, email, name) VALUES (v_member_id, 'inna.bocharoff@gmail.com', 'Inna');
  ELSE
    UPDATE users SET name = 'Inna', updated_at = NOW() WHERE id = v_member_id;
  END IF;

  -- List: "Tymoshchuk", owned by Bohdan
  SELECT id INTO v_list_id FROM lists WHERE owner_id = v_owner_id AND name = 'Tymoshchuk' LIMIT 1;
  IF v_list_id IS NULL THEN
    v_list_id := gen_random_uuid();
    INSERT INTO lists (id, owner_id, name) VALUES (v_list_id, v_owner_id, 'Tymoshchuk');
  END IF;

  INSERT INTO list_members (id, list_id, user_id, role)
  VALUES (gen_random_uuid(), v_list_id, v_owner_id, 'owner')
  ON CONFLICT (list_id, user_id) DO NOTHING;

  INSERT INTO list_members (id, list_id, user_id, role)
  VALUES (gen_random_uuid(), v_list_id, v_member_id, 'member')
  ON CONFLICT (list_id, user_id) DO NOTHING;

  -- One list_movies row per old movies row, plus up to two ratings.
  FOR m IN
    SELECT id, status, watch_date, comment_text, inna_rating, bogdan_rating
    FROM movies_temp
  LOOP
    INSERT INTO list_movies (id, list_id, movie_id, status, watch_date, comment_text, added_by)
    VALUES (gen_random_uuid(), v_list_id, m.id, m.status, m.watch_date, m.comment_text, v_owner_id)
    ON CONFLICT (list_id, movie_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_list_movie_id;
    v_list_movie_count := v_list_movie_count + 1;

    IF m.bogdan_rating IS NOT NULL THEN
      INSERT INTO list_movie_ratings (id, list_movie_id, user_id, rating, rated_by)
      VALUES (gen_random_uuid(), v_list_movie_id, v_owner_id, m.bogdan_rating, v_owner_id)
      ON CONFLICT (list_movie_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW();
      v_rating_count := v_rating_count + 1;
    END IF;

    IF m.inna_rating IS NOT NULL THEN
      INSERT INTO list_movie_ratings (id, list_movie_id, user_id, rating, rated_by)
      VALUES (gen_random_uuid(), v_list_movie_id, v_member_id, m.inna_rating, v_owner_id)
      ON CONFLICT (list_movie_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW();
      v_rating_count := v_rating_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Owner user: sleepless92@gmail.com -> %', v_owner_id;
  RAISE NOTICE 'Member user: inna.bocharoff@gmail.com -> %', v_member_id;
  RAISE NOTICE 'List: "Tymoshchuk" -> %', v_list_id;
  RAISE NOTICE 'list_movies created/updated: %, ratings: %', v_list_movie_count, v_rating_count;
END $$;

-- 3. Slim the live `movies` table down to a pure shared catalog.
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

COMMIT;

-- 4. Verify: row counts should match.
SELECT
  (SELECT COUNT(*) FROM movies_temp) AS old_movies_rows,
  (SELECT COUNT(*) FROM movies) AS movies_rows_now,
  (SELECT COUNT(*) FROM list_movies lm
     JOIN lists l ON l.id = lm.list_id
     WHERE l.name = 'Tymoshchuk') AS list_movies_rows,
  (SELECT COUNT(*) FROM list_movie_ratings lmr
     JOIN list_movies lm ON lm.id = lmr.list_movie_id
     JOIN lists l ON l.id = lm.list_id
     WHERE l.name = 'Tymoshchuk') AS ratings_rows;
