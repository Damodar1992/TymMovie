-- Run this once in the Neon SQL Editor (Neon console → your project →
-- "SQL Editor" tab → paste this whole file → Run) if you can't reach the
-- database from your own machine (TLS/proxy issues) to run `npm run
-- migrate` locally.
--
-- It's safe to run even if some of these tables/columns already exist —
-- every statement is IF NOT EXISTS / ADD COLUMN IF NOT EXISTS. At the end
-- it records all nine migrations as applied in `_migrations`, so a later
-- `npm run migrate` (once you fix the local connection) will see them as
-- already done and just say "Nothing to do".

CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 0001_create_movies_table.sql
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY,
  content_type VARCHAR(16) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_normalized VARCHAR(255) NOT NULL,
  original_title VARCHAR(255) NULL,
  tmdb_id INTEGER NULL,
  poster_url TEXT NULL,
  genres JSONB NULL,
  tmdb_rating NUMERIC(3,1) NULL,
  release_year INTEGER NULL,
  inna_rating NUMERIC(3,1) NULL,
  bogdan_rating NUMERIC(3,1) NULL,
  user_avg_rating NUMERIC(3,1) NULL,
  status VARCHAR(32) NOT NULL,
  watch_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_watch_date ON movies(watch_date DESC);
CREATE INDEX IF NOT EXISTS idx_movies_user_avg_rating ON movies(user_avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_title_normalized ON movies(title_normalized);
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_content_type ON movies(content_type);

-- 0002_add_title_ua.sql
ALTER TABLE movies ADD COLUMN IF NOT EXISTS title_ua VARCHAR(255) NULL;

-- 0003_add_comment_text.sql
ALTER TABLE movies ADD COLUMN IF NOT EXISTS comment_text TEXT NULL;

-- 0004_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  google_sub VARCHAR(64) NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NULL,
  avatar_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 0005_create_lists.sql
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);

-- 0006_create_list_members.sql
CREATE TABLE IF NOT EXISTS list_members (
  id UUID PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL DEFAULT 'member',
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id);

-- 0007_create_list_movies.sql
CREATE TABLE IF NOT EXISTS list_movies (
  id UUID PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  watch_date DATE NULL,
  comment_text TEXT NULL,
  added_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_list_movies_list_id ON list_movies(list_id);
CREATE INDEX IF NOT EXISTS idx_list_movies_status ON list_movies(list_id, status);
CREATE INDEX IF NOT EXISTS idx_list_movies_watch_date ON list_movies(list_id, watch_date DESC);

-- 0008_create_list_movie_ratings.sql
CREATE TABLE IF NOT EXISTS list_movie_ratings (
  id UUID PRIMARY KEY,
  list_movie_id UUID NOT NULL REFERENCES list_movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating NUMERIC(3,1) NULL,
  rated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (list_movie_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_list_movie_ratings_list_movie_id ON list_movie_ratings(list_movie_id);

-- 0009_create_list_invites.sql
CREATE TABLE IF NOT EXISTS list_invites (
  id UUID PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  role VARCHAR(16) NOT NULL DEFAULT 'member',
  created_by UUID NOT NULL REFERENCES users(id),
  revoked_at TIMESTAMP NULL,
  max_uses INTEGER NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_list_invites_list_id ON list_invites(list_id);
CREATE INDEX IF NOT EXISTS idx_list_invites_token ON list_invites(token);

-- Mark all nine as applied, so `npm run migrate` won't try to re-run them
-- later once your local connection to Neon is fixed.
INSERT INTO _migrations (id) VALUES
  ('0001_create_movies_table.sql'),
  ('0002_add_title_ua.sql'),
  ('0003_add_comment_text.sql'),
  ('0004_create_users.sql'),
  ('0005_create_lists.sql'),
  ('0006_create_list_members.sql'),
  ('0007_create_list_movies.sql'),
  ('0008_create_list_movie_ratings.sql'),
  ('0009_create_list_invites.sql')
ON CONFLICT (id) DO NOTHING;
