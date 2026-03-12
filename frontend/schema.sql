-- Run this in Neon SQL Editor to create the movies table (if not already created).
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_normalized VARCHAR(255) NOT NULL,
  original_title VARCHAR(255) NULL,
  imdb_id VARCHAR(32) NULL,
  poster_url TEXT NULL,
  genres JSONB NULL,
  imdb_rating NUMERIC(3,1) NULL,
  inna_rating NUMERIC(3,1) NULL,
  bogdan_rating NUMERIC(3,1) NULL,
  user_avg_rating NUMERIC(3,1) NULL,
  status VARCHAR(32) NOT NULL,
  watch_date DATE NULL,
  source_provider VARCHAR(64) NULL,
  source_payload JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_watch_date ON movies(watch_date DESC);
CREATE INDEX IF NOT EXISTS idx_movies_user_avg_rating ON movies(user_avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_title_normalized ON movies(title_normalized);
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING GIN(genres);
