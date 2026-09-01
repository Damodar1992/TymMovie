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
