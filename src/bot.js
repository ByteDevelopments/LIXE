'use strict';

const {
  Client, GatewayIntentBits, REST, Routes, Collection,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { Kazagumo } = require('kazagumo');
const { Connectors } = require('shoukaku');
const path = require('path');
const fs   = require('fs');
const { save247, remove247, getAll247, getIgnoredChannels } = require('./utils/db');
const { applyQualityFilters } = require('./utils/filters');
const { startNPSession, stopNPSession, refreshNPMessage } = require('./utils/nowplaying');
const { attachShardLogger, attachLavalinkLogger } = require('./utils/logger');

// ── Lavalink node config ──────────────────────────────────────────────────────
// Supports: YouTube, SoundCloud, Bandcamp, Twitch, Vimeo, Local files,
//           Instagram, JioSaavn, GetYarn, Clypit, Speak TTS, PornHub,
//           Reddit, OC ReMix, TikTok, Mixcloud, Soundgasm,
//           Spotify*, Apple Music*, Deezer*, Yandex Music*, Tidal*, Qobuz*
//           (* requires LavaSrc or matching Lavalink source plugin)
const LAVALINK_NODES = [
  {
    name:   'main',
    url:    'ultra.visionhost.cloud:2037',
    auth:   'Devine',
    secure: false
  }
];

// ── Autoplay ──────────────────────────────────────────────────────────────────
async function queueAutoplayTrack(client, player, lastTrack, configName) {
  try {
    const queries = [
      lastTrack.author ? `${lastTrack.author} mix` : lastTrack.title,
      lastTrack.title,
      lastTrack.author || lastTrack.title
    ];
    const query = queries[Math.floor(Math.random() * queries.length)];
    const result = await client.kazagumo.search(query, { engine: 'youtube', requester: client.user });
    if (!result?.tracks?.length) return false;
    const candidates = result.tracks.slice(0, 5).filter(t => t.title !== lastTrack.title);
    const pool = candidates.length ? candidates : result.tracks.slice(0, 5);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    player.queue.add(pick);
    if (!player.playing && !player.paused) player.play();
    console.log(`[${configName.toUpperCase()}] Autoplay queued "${pick.title}" in guild ${player.guildId}`);
    return true;
  } catch (err) {
    console.error(`[${configName.toUpperCase()}] Autoplay error in guild ${player.guildId}:`, err.message);
    return false;
  }
}

function createBot(config, startedAt) {
  const client = new Client({
    // GuildMembers is required for the DM welcome feature
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      // <-- privileged intent: enable in Discord Dev Portal
    ]
  });

  client.botConfig     = config;
  client.startedAt     = startedAt;
  client.twoFourSeven  = new Map();
  client.autoplay      = new Map();
  client.lastTrack     = new Map();
  client.skipNPCard    = new Set();
  client.npMessages    = new Map();
  client.npIntervals   = new Map();
  client.searchResults = new Map();
  client.activeFilter  = new Map(); // guildId -> filter name
  client.commands      = new Collection();

  // ── Kazagumo (Lavalink wrapper) ──────────────────────────────────────────
  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: 'youtube',
      plugins: [],
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      }
    },
    new Connectors.DiscordJS(client),
    LAVALINK_NODES
  );
  client.kazagumo = kazagumo;

  // ── Attach shard & Lavalink loggers ──────────────────────────────────────
  attachShardLogger(client, config.name);
  attachLavalinkLogger(client, kazagumo, config.name);
  kazagumo.on('playerStart', async (player, track) => {
    console.log(`[${config.name.toUpperCase()}] Now playing: "${track.title}" in guild ${player.guildId}`);
    client.lastTrack.set(player.guildId, track);
    if (client.skipNPCard.has(player.guildId)) {
      client.skipNPCard.delete(player.guildId);
      return;
    }
    stopNPSession(client, player.guildId);
    await startNPSession({ player, track, client, guildId: player.guildId });
  });

  kazagumo.on('playerEmpty', async (player) => {
    stopNPSession(client, player.guildId);
    if (!client.autoplay.get(player.guildId)) return;
    const last = client.lastTrack.get(player.guildId);
    if (!last) return;
    await queueAutoplayTrack(client, player, last, config.name);
  });

  kazagumo.on('playerException', (player, data) => {
    console.error(`[${config.name.toUpperCase()}] Player exception in ${player.guildId}:`, data);
  });

  kazagumo.on('ready', async (name) => {
    console.log(`[${config.name.toUpperCase()}] Lavalink node "${name}" ready — restoring 24/7 sessions`);
    for (const row of getAll247(config.clientId)) {
      client.twoFourSeven.set(row.guild_id, { voiceId: row.voice_id, textId: row.text_id });
      try {
        await joinChannel(client, row.guild_id, row.voice_id, row.text_id);
        console.log(`[${config.name.toUpperCase()}] Restored 24/7 in guild ${row.guild_id}`);
      } catch (err) {
        console.error(`[${config.name.toUpperCase()}] Failed to restore guild ${row.guild_id}:`, err.message);
      }
    }
  });

  // ── Load commands ────────────────────────────────────────────────────────
  const commandsPath = path.join(__dirname, 'commands');
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
  }

  // ── Bot ready ────────────────────────────────────────────────────────────
  client.on('ready', async () => {
    console.log(`[BOT] ${config.name} (${client.user.tag}) online`);
    const activities = [
  () => `Love Music 🎵`,
  () => `${client.guilds.cache.size} Servers`,
  () => `${client.channels.cache.size} Channels`,
  () => `${client.users.cache.size} Users`
];

let index = 0;

setInterval(() => {
  const activity = activities[index % activities.length]();

  client.user.setActivity(activity, {
    type: 3 // WATCHING
  });

  index++;
}, 3000);
    // Clean stale search results every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of client.searchResults) {
        if (val.expiresAt < now) client.searchResults.delete(key);
      }
    }, 120_000);
  });

  // ── DM welcome on guild join ─────────────────────────────────────────────
  client.on('guildMemberAdd', async (member) => {
    // Skip bots
    if (member.user.bot) return;
    // Check if commands are ignored in any channel — this event is guild-wide
    // so we just DM welcome regardless of channel ignore list
    try {
      const dm = await member.createDM();
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## Welcome to ${member.guild.name}`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Hey **${member.user.username}**, welcome to **${member.guild.name}**!\n\n` +
          `I am **${client.user.username}**, your music bot.\n\n` +
          `Use \`/play\` to start playing music, \`/help\` to see all commands, ` +
          `or \`/search\` to find a specific track.\n\n` +
          `Enjoy your stay and the music!`
        )
      );
      await dm.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch {
      // DMs may be closed — silently ignore
    }
  });

  // ── Interaction handler ──────────────────────────────────────────────────
  client.on('interactionCreate', async (interaction) => {

    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      // Check if this channel is in the ignore list
      const ignored = getIgnoredChannels(interaction.guildId, config.clientId);
      if (ignored.includes(interaction.channelId)) {
        return interaction.reply({ content: 'Commands are disabled in this channel.', ephemeral: true });
      }

      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[ERROR] Command ${interaction.commandName}:`, err);
        const payload = { content: 'An error occurred.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    // ── NP Buttons ──────────────────────────────────────────────────────────
    if (interaction.isButton()) {
      const [action, guildId] = interaction.customId.split(':');
      if (!['np_toggle', 'np_skip'].includes(action)) return;
      const player = client.kazagumo.players.get(guildId);
      if (!player) return interaction.reply({ content: 'No active player.', ephemeral: true });
      await interaction.deferUpdate();
      if (action === 'np_toggle') {
        player.paused ? player.pause(false) : player.pause(true);
        await refreshNPMessage(client, guildId);
      } else if (action === 'np_skip') {
        stopNPSession(client, guildId);
        player.skip();
      }
      return;
    }

    // ── Select menus ─────────────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      const parts   = interaction.customId.split(':');
      const action  = parts[0];
      const guildId = parts[1];

      // Queue jump
      if (action === 'np_queue') {
        const player = client.kazagumo.players.get(guildId);
        if (!player) return interaction.reply({ content: 'No active player.', ephemeral: true });
        await interaction.deferUpdate();
        const idx = parseInt(interaction.values[0], 10);
        if (isNaN(idx) || idx < 0) return;
        const upcoming = [...player.queue];
        if (idx >= upcoming.length) return;
        player.queue.splice(0, idx);
        stopNPSession(client, guildId);
        player.skip();
        return;
      }

      // Search pick
      if (action === 'search_pick') {
        const userId = parts[2];
        const key    = `${guildId}:${userId}`;
        const stored = client.searchResults.get(key);
        if (!stored || interaction.user.id !== userId) {
          return interaction.reply({ content: 'This search result is not for you or has expired.', ephemeral: true });
        }
        const idx   = parseInt(interaction.values[0], 10);
        const track = stored.tracks[idx];
        if (!track) return interaction.reply({ content: 'Invalid selection.', ephemeral: true });
        await interaction.deferUpdate();
        client.searchResults.delete(key);

        const voiceChannel = interaction.guild.voiceStates.cache.get(interaction.user.id)?.channel;
        if (!voiceChannel) return interaction.followUp({ content: '> You need to be in a voice channel.', ephemeral: true });

        let player = client.kazagumo.players.get(guildId);
        if (player && player.voiceId !== voiceChannel.id) { await player.destroy(); player = null; }
        if (!player) {
          player = await client.kazagumo.createPlayer({
            guildId, voiceId: voiceChannel.id, textId: interaction.channelId, deaf: true, volume: 200
          });
          await applyQualityFilters(player);
        }
        const wasPlaying = player.playing || player.paused;
        player.queue.add(track);
        if (!wasPlaying) {
          client.skipNPCard.add(guildId);
          player.play();
          player.setVolume(200);
          await startNPSession({ player, track, client, guildId, textChannelId: interaction.channelId });
        }

        function fmtDuration(ms) {
          if (!ms || ms <= 0) return 'LIVE';
          const s = Math.floor(ms / 1000);
          return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        }
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(wasPlaying ? '## Added to Queue' : '## Now Playing'));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**${track.title}**\nby **${track.author || 'Unknown'}**  •  \`${fmtDuration(track.length)}\``
        ));
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        return;
      }
    }
  });

  // ── 24/7 auto-rejoin on disconnect ───────────────────────────────────────
  client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.id !== client.user?.id) return;
    if (oldState.channelId && !newState.channelId) {
      const is247 = client.twoFourSeven.get(oldState.guild.id);
      if (!is247) return;
      console.log(`[${config.name.toUpperCase()}] Disconnected — 24/7 active, rejoining guild ${oldState.guild.id}...`);
      setTimeout(async () => {
        await joinChannel(client, oldState.guild.id, is247.voiceId, is247.textId).catch(err => {
          console.error(`[${config.name.toUpperCase()}] Auto-rejoin failed:`, err.message);
        });
      }, 3000);
    }
  });

  client.login(config.token).catch(err => {
    console.error(`[FATAL] Failed to login bot "${config.name}":`, err.message);
  });

  return client;
}

async function joinChannel(client, guildId, voiceChannelId, textChannelId) {
  try {
    let player = client.kazagumo.players.get(guildId);
    if (!player) {
      player = await client.kazagumo.createPlayer({
        guildId, voiceId: voiceChannelId, textId: textChannelId, deaf: true, volume: 200
      });
      await applyQualityFilters(player);
    }
    return player;
  } catch (err) {
    console.error(`[BOT] Error joining channel for guild ${guildId}:`, err.message);
  }
}

// ── Command registration split ────────────────────────────────────────────────
// restart + reconnect → dev guild only (sensitive ops)
// customize          → global (owner guard is inside the command itself)
// everything else    → global
const GUILD_ONLY_COMMANDS = new Set(['restart', 'reconnect']);
const DEV_GUILD_ID         = '1482191847366594570';

async function registerCommands(config, client) {
  const publicCmds   = [];
  const guildOnlyCmds = [];
  const commandsPath = path.join(__dirname, 'commands');

  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(commandsPath, file));
    if (!cmd.data) continue;
    if (GUILD_ONLY_COMMANDS.has(cmd.data.name)) {
      guildOnlyCmds.push(cmd.data.toJSON());
    } else {
      publicCmds.push(cmd.data.toJSON());  // includes customize — guarded internally
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  // Global commands (including /customize)
  try {
    await rest.put(Routes.applicationCommands(config.clientId), { body: publicCmds });
    console.log(`[${config.name.toUpperCase()}] ${publicCmds.length} commands registered globally`);
  } catch (err) {
    console.error(`[${config.name.toUpperCase()}] Failed to register global commands:`, err.message);
  }

  // Guild-only sensitive commands
  if (guildOnlyCmds.length) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, DEV_GUILD_ID),
        { body: guildOnlyCmds }
      );
      console.log(`[${config.name.toUpperCase()}] ${guildOnlyCmds.length} guild-only commands registered in ${DEV_GUILD_ID}`);
    } catch (err) {
      console.error(`[${config.name.toUpperCase()}] Failed to register guild-only commands:`, err.message);
    }
  }
}

module.exports = { createBot, joinChannel, save247, remove247 };
