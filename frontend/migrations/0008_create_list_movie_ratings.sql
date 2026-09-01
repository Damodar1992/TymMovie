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
