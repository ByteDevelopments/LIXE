'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  MessageFlags
} = require('discord.js');

const OWNER_ID = '1032944901412880394';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EMOJI LEGEND  (every emoji used in this help command, defined once here)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const E = {
  // Category headers
  CAT_PLAY      : '🎵',   // Music Playback
  CAT_QUEUE     : '📋',   // Queue Management
  CAT_FILTER    : '🎛️',   // Audio Filters
  CAT_CONFIG    : '⚙️',   // Server Config
  CAT_INFO      : '📊',   // Info & Utility
  CAT_PLATFORMS : '🌐',   // Supported Platforms
  CAT_OWNER     : '🔐',   // Owner Commands

  // Command-level decorators
  CMD           : '╸',    // bullet prefix on every command line
  PLAY          : '▶️',
  SEARCH        : '🔍',
  STOP          : '⏹️',
  PAUSE         : '⏸️',
  RESUME        : '▶️',
  SKIP          : '⏭️',
  PREV          : '⏮️',
  SEEK          : '⏱️',
  REPLAY        : '🔁',
  VOLUME        : '🔊',
  LOOP          : '🔂',
  NP            : '🎶',
  QUEUE         : '📜',
  AUTOPLAY      : '✨',
  JOIN          : '📥',
  DISCONNECT    : '📤',

  BASS          : '🎸',
  LOFI          : '☁️',
  SLOWREVERB    : '🌊',
  NIGHTCORE     : '⚡',
  LOWPASS       : '🔉',
  HIGHPASS      : '🔈',
  RESET         : '♻️',

  TF247         : '🕐',
  IGNORE        : '🚫',

  PING          : '🏓',
  STATS         : '🖥️',
  NODE          : '🔗',
  USERINFO      : '👤',
  SUPPORT       : '💬',
  HELP          : '❓',

  RESTART       : '🔄',
  RECONNECT     : '🔌',
  CUSTOMIZE     : '🎨',

  // Tips / footer
  TIP           : '💡',
  LOCK          : '🔒',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: false });

    const isOwner = interaction.user.id === OWNER_ID;
    const name    = client.botConfig.name.toUpperCase();

    // ── HEADER ──────────────────────────────────────────────────────────────
    const header = [
      `# ${E.CAT_PLAY} ${name} — Command Reference`,
      '',
      `> ${E.TIP} Every emoji in this menu has a meaning — see the legend below each section.`,
      '',
    ].join('\n');

    // ── EMOJI LEGEND BLOCK ───────────────────────────────────────────────────
    const legend = [
      `### 📖 Emoji Legend`,
      `${E.CAT_PLAY} Music  ${E.CAT_QUEUE} Queue  ${E.CAT_FILTER} Filters  ${E.CAT_CONFIG} Config  ${E.CAT_INFO} Info  ${E.CAT_PLATFORMS} Platforms` + (isOwner ? `  ${E.CAT_OWNER} Owner` : ''),
      `${E.PLAY} play  ${E.SEARCH} search  ${E.STOP} stop  ${E.PAUSE} pause  ${E.RESUME} resume  ${E.SKIP} skip  ${E.PREV} previous`,
      `${E.SEEK} seek  ${E.REPLAY} replay  ${E.VOLUME} volume  ${E.LOOP} loop  ${E.NP} nowplaying  ${E.AUTOPLAY} autoplay`,
      `${E.JOIN} join  ${E.DISCONNECT} disconnect  ${E.TF247} 24/7  ${E.IGNORE} ignore`,
      `${E.BASS} bass  ${E.LOFI} lo-fi  ${E.SLOWREVERB} slow+reverb  ${E.NIGHTCORE} nightcore  ${E.LOWPASS} lowpass  ${E.HIGHPASS} highpass  ${E.RESET} reset`,
      `${E.PING} ping  ${E.STATS} stats  ${E.NODE} node  ${E.USERINFO} userinfo  ${E.SUPPORT} support  ${E.HELP} help`,
    ].join('\n');

    // ── SECTION 1 : MUSIC PLAYBACK ──────────────────────────────────────────
    const secPlay = [
      `### ${E.CAT_PLAY} Music Playback`,
      `${E.PLAY} ${E.CMD} \`/play <query>\`         Play from URL or search term (all platforms)`,
      `${E.SEARCH} ${E.CMD} \`/search <query>\`       Search and pick a track interactively`,
      `${E.PAUSE} ${E.CMD} \`/pause\`                Pause the current track`,
      `${E.RESUME} ${E.CMD} \`/resume\`               Resume a paused track`,
      `${E.STOP} ${E.CMD} \`/stop\`                 Stop playback and clear the queue`,
      `${E.REPLAY} ${E.CMD} \`/replay\`               Restart the current track from scratch`,
      `${E.VOLUME} ${E.CMD} \`/volume <50-200>\`      Adjust the playback volume`,
      `${E.JOIN} ${E.CMD} \`/join\`                 Join your current voice channel`,
      `${E.DISCONNECT} ${E.CMD} \`/disconnect\`           Disconnect the bot from voice`,
    ].join('\n');

    // ── SECTION 2 : QUEUE MANAGEMENT ───────────────────────────────────────
    const secQueue = [
      `### ${E.CAT_QUEUE} Queue Management`,
      `${E.QUEUE} ${E.CMD} \`/queue [page]\`         Browse the current queue`,
      `${E.SKIP} ${E.CMD} \`/skip [amount]\`         Skip one or more tracks forward`,
      `${E.PREV} ${E.CMD} \`/previous\`              Go back to the previous track`,
      `${E.SEEK} ${E.CMD} \`/seek <time>\`           Jump to a position  e.g. \`1:30\``,
      `${E.LOOP} ${E.CMD} \`/loop <mode>\`           Loop: \`track\` · \`queue\` · \`off\``,
      `${E.AUTOPLAY} ${E.CMD} \`/autoplay\`             Toggle auto-queue of related tracks`,
      `${E.NP} ${E.CMD} \`/nowplaying\`            Show the live now-playing card`,
    ].join('\n');

    // ── SECTION 3 : AUDIO FILTERS ───────────────────────────────────────────
    const secFilters = [
      `### ${E.CAT_FILTER} Audio Filters`,
      `${E.BASS} ${E.CMD} \`/filter preset:Bass Boost\`      Heavy bass enhancement`,
      `${E.LOFI} ${E.CMD} \`/filter preset:Lo-Fi\`           Warm, slowed lo-fi vibes`,
      `${E.SLOWREVERB} ${E.CMD} \`/filter preset:Slow + Reverb\`   Slowed with reverb timescale`,
      `${E.NIGHTCORE} ${E.CMD} \`/filter preset:Nightcore\`        Sped-up + higher pitch`,
      `${E.LOWPASS} ${E.CMD} \`/filter preset:Low Pass\`        Cuts high frequencies`,
      `${E.HIGHPASS} ${E.CMD} \`/filter preset:High Pass\`       Cuts low frequencies`,
      `${E.RESET} ${E.CMD} \`/filter preset:Reset (HQ)\`      Remove all filters — restore HQ`,
    ].join('\n');

    // ── SECTION 4 : SERVER CONFIG ───────────────────────────────────────────
    const secConfig = [
      `### ${E.CAT_CONFIG} Server Config`,
      `${E.TF247} ${E.CMD} \`/247\`     Toggle 24/7 mode — bot stays in voice permanently`,
      `${E.IGNORE} ${E.CMD} \`/ignore\`  Ignore / un-ignore a channel for bot commands`,
    ].join('\n');

    // ── SECTION 5 : INFO & UTILITY ──────────────────────────────────────────
    const secInfo = [
      `### ${E.CAT_INFO} Info & Utility`,
      `${E.PING} ${E.CMD} \`/ping\`              Bot & API latency`,
      `${E.STATS} ${E.CMD} \`/stats\`             Full system stats (bot · shards · Lavalink)`,
      `${E.NODE} ${E.CMD} \`/node\`              Lavalink node details`,
      `${E.USERINFO} ${E.CMD} \`/userinfo [user]\`   Info about any server member`,
      `${E.SUPPORT} ${E.CMD} \`/support\`           Get the support server link`,
      `${E.HELP} ${E.CMD} \`/help\`               Show this message`,
    ].join('\n');

    // ── SECTION 6 : SUPPORTED PLATFORMS ────────────────────────────────────
    const secPlatforms = [
      `### ${E.CAT_PLATFORMS} Supported Platforms`,
      `**Streaming**   YouTube · Spotify · SoundCloud · Apple Music · Deezer · Tidal · Qobuz · Yandex Music`,
      `**Social**      TikTok · Reddit · Instagram · Twitch · Vimeo · Mixcloud`,
      `**Other**       JioSaavn · Bandcamp · Soundgasm · GetYarn · Clypit · OC ReMix`,
      `**Direct**      Local files · HTTP/HTTPS URLs · PornHub`,
    ].join('\n');

    // ── TIPS ────────────────────────────────────────────────────────────────
    const tips = [
      `### ${E.TIP} Quick Tips`,
      `${E.NP}  The **Now Playing card** has inline ${E.PAUSE}**pause** · ${E.SKIP}**skip** buttons`,
      `${E.QUEUE}  The **queue dropdown** lets you jump directly to any track`,
      `${E.AUTOPLAY}  **Autoplay** keeps the music going when the queue ends`,
    ].join('\n');

    // ── OWNER SECTION (only shown to owner) ─────────────────────────────────
    const ownerBlock = isOwner ? [
      `### ${E.CAT_OWNER} Owner Commands ${E.LOCK}`,
      `${E.RESTART} ${E.CMD} \`/restart\`                            Gracefully restart all bot instances`,
      `${E.RECONNECT} ${E.CMD} \`/reconnect\`                          Reconnect all shards + Lavalink nodes`,
      `${E.CUSTOMIZE} ${E.CMD} \`/customize pfp:<url> banner:<url>\`   Change bot avatar & banner`,
      '',
      `-# ${E.LOCK} Restricted to bot owner — visible only to you`,
    ].join('\n') : null;

    // ── ASSEMBLE CONTAINER ───────────────────────────────────────────────────
    const container = new ContainerBuilder();

    // Block 1: Header + Legend
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent([header, legend].join('\n'))
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));

    // Block 2: Play + Queue (logically grouped)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent([secPlay, '', secQueue].join('\n'))
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));

    // Block 3: Filters
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(secFilters)
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));

    // Block 4: Config + Info (smaller sections, grouped)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent([secConfig, '', secInfo].join('\n'))
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));

    // Block 5: Platforms + Tips
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent([secPlatforms, '', tips].join('\n'))
    );

    // Block 6: Owner (conditional)
    if (ownerBlock) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(ownerBlock));
    }

    // Block 7: Action buttons
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('💬  Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL(client.botConfig.supportInvite ?? 'https://discord.com'),
        new ButtonBuilder()
          .setLabel('📨  Invite Bot')
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/api/oauth2/authorize?client_id=${client.botConfig.clientId}` +
            `&permissions=2184260672&scope=bot%20applications.commands`
          )
      )
    );

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
