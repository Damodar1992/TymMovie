-- Run this in Neon SQL Editor to create the movies table (if not already created).
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
