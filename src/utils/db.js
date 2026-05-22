'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, '..', '..', 'db.sql'), 'utf-8');
  db.exec(schema);
}

// ── 24/7 ─────────────────────────────────────────────────────────────────────

function save247(guildId, clientId, voiceId, textId) {
  const stmt = getDb().prepare(`
    INSERT INTO guild_settings (guild_id, client_id, voice_id, text_id, enabled, updated_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
    ON CONFLICT(guild_id, client_id) DO UPDATE SET
      voice_id   = excluded.voice_id,
      text_id    = excluded.text_id,
      enabled    = 1,
      updated_at = datetime('now')
  `);
  stmt.run(guildId, clientId, voiceId, textId);
}

function remove247(guildId, clientId) {
  getDb().prepare(`DELETE FROM guild_settings WHERE guild_id = ? AND client_id = ?`).run(guildId, clientId);
}

function getAll247(clientId) {
  return getDb().prepare(`
    SELECT guild_id, voice_id, text_id FROM guild_settings
    WHERE client_id = ? AND enabled = 1
  `).all(clientId);
}

// ── Ignored channels ──────────────────────────────────────────────────────────

function addIgnoredChannel(guildId, clientId, channelId) {
  getDb().prepare(`
    INSERT OR IGNORE INTO ignored_channels (guild_id, client_id, channel_id) VALUES (?, ?, ?)
  `).run(guildId, clientId, channelId);
}

function removeIgnoredChannel(guildId, clientId, channelId) {
  getDb().prepare(`
    DELETE FROM ignored_channels WHERE guild_id = ? AND client_id = ? AND channel_id = ?
  `).run(guildId, clientId, channelId);
}

function getIgnoredChannels(guildId, clientId) {
  return getDb().prepare(`
    SELECT channel_id FROM ignored_channels WHERE guild_id = ? AND client_id = ?
  `).all(guildId, clientId).map(r => r.channel_id);
}

module.exports = { save247, remove247, getAll247, addIgnoredChannel, removeIgnoredChannel, getIgnoredChannels };
