'use strict';

const os = require('os');
const pidusage = require('pidusage');

function formatUptime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const days    = Math.floor(totalSec / 86400);
  const hours   = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts = [];
  if (days)    parts.push(`${days}d`);
  if (hours)   parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function getSystemStats(client, startedAt) {
  const usage    = await pidusage(process.pid);
  const totalMem = os.totalmem();
  const guilds   = client.guilds.cache.size;
  const shards   = client.shard ? client.shard.count : 1;
  const uptime   = formatUptime(Date.now() - startedAt);
  const cpu      = `${usage.cpu.toFixed(1)}%`;
  const ram      = `${formatBytes(usage.memory)} / ${formatBytes(totalMem)}`;

  const activePlayers = client.kazagumo
    ? Array.from(client.kazagumo.players.values()).filter(p => p.playing).length
    : 0;

  // Lavalink node stats
  const shoukaku = client.kazagumo?.shoukaku;
  const nodes = shoukaku ? [...shoukaku.nodes.values()] : [];
  const lavalinkLines = [];
  for (const node of nodes) {
    const state = node.state === 1 ? 'Connected' : node.state === 2 ? 'Reconnecting' : 'Disconnected';
    const s = node.stats;
    lavalinkLines.push(
      `${node.name} — ${state}` +
      (s ? `  |  Players: ${s.players ?? 0}  |  CPU: ${s.cpu?.lavalinkLoad != null ? (s.cpu.lavalinkLoad * 100).toFixed(1) + '%' : '—'}  |  RAM: ${formatBytes(s.memory?.used ?? 0)}` : '')
    );
  }

  return {
    uptime,
    cpu,
    ram,
    shards,
    guilds,
    activePlayers,
    lavalinkNodes: lavalinkLines.join('\n') || 'No nodes connected'
  };
}

module.exports = { getSystemStats, formatUptime, formatBytes };
