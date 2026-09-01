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
