'use strict';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  LIXE — Shard & Lavalink Logger  (Components V2)
 *  All shard lifecycle events + Lavalink connect/disconnect → log channel
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js');

const LOG_CHANNEL_ID = '1487631718059086037';

// ── Helpers ──────────────────────────────────────────────────────────────────

function ts() {
  return `<t:${Math.floor(Date.now() / 1000)}:T>`;
}

function tsF() {
  return `<t:${Math.floor(Date.now() / 1000)}:F>`;
}

function uptimeFmt(ms) {
  if (!ms || ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sc}s`;
  return `${m}m ${sc}s`;
}

async function sendLog(client, content) {
  try {
    const ch = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!ch) return;
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    await ch.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
  } catch (err) {
    console.error('[LOGGER] Failed to send log:', err.message);
  }
}

async function sendRichLog(client, blocks) {
  // blocks = array of strings — each becomes a separate TextDisplay separated by a divider
  try {
    const ch = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!ch) return;
    const c = new ContainerBuilder();
    for (let i = 0; i < blocks.length; i++) {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(blocks[i]));
      if (i < blocks.length - 1) {
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      }
    }
    await ch.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
  } catch (err) {
    console.error('[LOGGER] Failed to send rich log:', err.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SHARD EVENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function attachShardLogger(client, botName) {
  const name = botName.toUpperCase();

  // ── Shard Ready ────────────────────────────────────────────────────────────
  client.on('shardReady', async (shardId) => {
    console.log(`[${name}] Shard ${shardId} ready`);
    await sendRichLog(client, [
      [
        `### <:onlinex:1502148669208789042> Shard Ready`,
        `**Bot:** \`${name}\``,
        `**Shard:** \`#${shardId}\``,
        `**Status:** Online and accepting events`,
        `**Time:** ${ts()}`,
      ].join('\n'),
      [
        `**Guilds on shard:** ${client.guilds.cache.filter(g => g.shardId === shardId).size}`,
        `-# Shard #${shardId} fully operational`,
      ].join('\n'),
    ]);
  });

  // ── Shard Disconnect ───────────────────────────────────────────────────────
  client.on('shardDisconnect', async (event, shardId) => {
    console.warn(`[${name}] Shard ${shardId} disconnected — code ${event.code}`);
    await sendRichLog(client, [
      [
        `### <:onlinex:1502148669208789042> Shard Disconnected`,
        `**Bot:** \`${name}\``,
        `**Shard:** \`#${shardId}\``,
        `**Close code:** \`${event.code ?? 'unknown'}\``,
        `**Reason:** ${event.reason || 'No reason provided'}`,
        `**Time:** ${ts()}`,
      ].join('\n'),
      [
        `**Will reconnect:** ${event.wasClean === false ? 'Yes — attempting now' : 'Depends on close code'}`,
        `-# Monitor for reconnect event. If stuck, use \`/reconnect\`.`,
      ].join('\n'),
    ]);
  });

  // ── Shard Reconnecting ─────────────────────────────────────────────────────
  client.on('shardReconnecting', async (shardId) => {
    console.log(`[${name}] Shard ${shardId} reconnecting...`);
    await sendLog(client, [
      `### 🟡 Shard Reconnecting`,
      `**Bot:** \`${name}\`  ·  **Shard:** \`#${shardId}\``,
      `Discord is re-establishing the WebSocket connection.`,
      `**Time:** ${ts()}`,
      `-# No action needed — this is automatic`,
    ].join('\n'));
  });

  // ── Shard Resume ──────────────────────────────────────────────────────────
  client.on('shardResume', async (shardId, replayedEvents) => {
    console.log(`[${name}] Shard ${shardId} resumed — ${replayedEvents} events replayed`);
    await sendRichLog(client, [
      [
        `### 🔵 Shard Resumed`,
        `**Bot:** \`${name}\``,
        `**Shard:** \`#${shardId}\``,
        `**Events replayed:** \`${replayedEvents}\``,
        `**Time:** ${ts()}`,
      ].join('\n'),
      [
        `**Status:** Session restored successfully`,
        `-# Shard #${shardId} is back online`,
      ].join('\n'),
    ]);
  });

  // ── Shard Error ────────────────────────────────────────────────────────────
  client.on('shardError', async (error, shardId) => {
    console.error(`[${name}] Shard ${shardId} error:`, error.message);
    await sendRichLog(client, [
      [
        `### ⚠️ Shard Error`,
        `**Bot:** \`${name}\``,
        `**Shard:** \`#${shardId}\``,
        `**Error:** \`${error.message}\``,
        `**Time:** ${ts()}`,
      ].join('\n'),
      [
        `**Action:** WebSocket will attempt to reconnect automatically.`,
        `-# Check console for full stack trace`,
      ].join('\n'),
    ]);
  });

  // ── Bot fully ready (all shards up) ───────────────────────────────────────
  client.once('ready', async () => {
    const uptime    = uptimeFmt(Date.now() - (client.startedAt ?? Date.now()));
    const guilds    = client.guilds.cache.size;
    const users     = client.users.cache.size;
    const shardInfo = client.ws.shards.size > 0
      ? `${client.ws.shards.size} shards`
      : 'Single process';

    await sendRichLog(client, [
      [
        `### <:onlinex:1502148669208789042> Bot Online`,
        `**Bot:** \`${name}\`  (\`${client.user.tag}\`)`,
        `**Sharding:** ${shardInfo}`,
        `**Guilds:** ${guilds}  ·  **Cached users:** ${users}`,
        `**Started:** ${tsF()}`,
      ].join('\n'),
      [
        `**Lavalink nodes:** connecting...`,
        `-# Lavalink status will update in the next log entry`,
      ].join('\n'),
    ]);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LAVALINK / SHOUKAKU EVENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function attachLavalinkLogger(client, kazagumo, botName) {
  const name    = botName.toUpperCase();
  const shoukaku = kazagumo.shoukaku;

  // ── Node Ready (connected) ─────────────────────────────────────────────────
  shoukaku.on('ready', async (nodeName) => {
    console.log(`[${name}] Lavalink node "${nodeName}" connected`);
    const node  = shoukaku.nodes.get(nodeName);
    const stats = node?.stats;

    await sendRichLog(client, [
      [
        `### <:onlinex:1502148669208789042> Lavalink Connected`,
        `**Bot:** \`${name}\``,
        `**Node:** \`${nodeName}\``,
        `**URL:** \` 'main'}\``,
        `**Time:** ${ts()}`,
      ].join('\n'),
      stats ? [
        `**Players:** ${stats.players ?? 0} total  ·  ${stats.playingPlayers ?? 0} playing`,
        `**Memory used:** ${fmtBytes(stats.memory?.used ?? 0)}  ·  **Free:** ${fmtBytes(stats.memory?.free ?? 0)}`,
        `**CPU cores:** ${stats.cpu?.cores ?? '—'}  ·  **System load:** ${stats.cpu?.systemLoad != null ? (stats.cpu.systemLoad * 100).toFixed(1) + '%' : '—'}`,
      ].join('\n') : `-# Stats not yet available`,
    ]);
  });

  // ── Node Error ─────────────────────────────────────────────────────────────
  shoukaku.on('error', async (nodeName, error) => {
    console.error(`[${name}] Lavalink node "${nodeName}" error:`, error.message);
    await sendRichLog(client, [
      [
        `### ⚠️ Lavalink Error`,
        `**Bot:** \`${name}\``,
        `**Node:** \`${nodeName}\``,
        `**Error:** \`${error.message}\``,
        `**Time:** ${ts()}`,
      ].join('\n'),
      [
        `**Action:** Shoukaku will attempt to reconnect automatically.`,
        `-# Check console for full stack. Use \`/reconnect\` if node stays down.`,
      ].join('\n'),
    ]);
  });

  // ── Node Close (disconnected) ──────────────────────────────────────────────
  shoukaku.on('close', async (nodeName, code, reason) => {
    console.warn(`[${name}] Lavalink node "${nodeName}" closed — code ${code}`);
    await sendRichLog(client, [
      [
        `### 🔴 Lavalink Disconnected`,
        `**Bot:** \`${name}\``,
        `**Node:** \`${nodeName}\``,
        `**Close code:** \`${code ?? 'unknown'}\``,
        `**Reason:** ${reason || 'No reason provided'}`,
        `**Time:** ${ts()}`,
      ].join('\n'),
      [
        `**Impact:** Active players on this node will stop.`,
        `**Action:** Shoukaku will attempt reconnection. Use \`/reconnect\` to force.`,
        `-# 24/7 sessions will restore automatically once node is back`,
      ].join('\n'),
    ]);
  });

  // ── Node Disconnect (pre-reconnect) ───────────────────────────────────────
  shoukaku.on('disconnect', async (nodeName, players, moved) => {
    console.warn(`[${name}] Lavalink node "${nodeName}" disconnecting — ${players.length} players affected`);
    if (!players.length) return; // silent if no players
    await sendLog(client, [
      `### 🟠 Lavalink Node Disconnecting`,
      `**Bot:** \`${name}\`  ·  **Node:** \`${nodeName}\``,
      `**Players affected:** ${players.length}  ·  **Moved to failover:** ${moved ? 'Yes' : 'No'}`,
      `**Time:** ${ts()}`,
      `-# Players will resume if a failover node is available`,
    ].join('\n'));
  });
}

// ── Byte formatter (used in Lavalink stats) ───────────────────────────────────
function fmtBytes(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
  if (bytes >= 1048576)    return (bytes / 1048576).toFixed(2) + ' MB';
  if (bytes >= 1024)       return (bytes / 1024).toFixed(2) + ' KB';
  return bytes + ' B';
}

module.exports = { attachShardLogger, attachLavalinkLogger };
