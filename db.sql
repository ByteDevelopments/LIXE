CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id   TEXT NOT NULL,
  client_id  TEXT NOT NULL,
  voice_id   TEXT,
  text_id    TEXT,
  enabled    INTEGER DEFAULT 1,
  updated_at TEXT,
  PRIMARY KEY (guild_id, client_id)
);

CREATE TABLE IF NOT EXISTS ignored_channels (
  guild_id   TEXT NOT NULL,
  client_id  TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  PRIMARY KEY (guild_id, client_id, channel_id)
);
