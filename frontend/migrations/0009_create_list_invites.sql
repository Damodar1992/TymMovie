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
