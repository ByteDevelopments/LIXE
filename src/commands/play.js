'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { applyQualityFilters } = require('../utils/filters');
const { startNPSession } = require('../utils/nowplaying');

function fmtDuration(ms) {
  if (!ms || ms <= 0) return 'LIVE';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Detect engine from URL
function detectEngine(query) {
  if (/spotify\.com/i.test(query))       return 'spotify';
  if (/soundcloud\.com/i.test(query))    return 'soundcloud';
  if (/deezer\.com/i.test(query))        return 'deezer';
  if (/music\.apple\.com/i.test(query))  return 'applemusic';
  if (/music\.yandex/i.test(query))      return 'yandexmusic';
  if (/tidal\.com/i.test(query))         return 'tidal';
  if (/qobuz\.com/i.test(query))         return 'qobuz';
  if (/bandcamp\.com/i.test(query))      return 'bandcamp';
  if (/twitch\.tv/i.test(query))         return 'twitch';
  if (/vimeo\.com/i.test(query))         return 'vimeo';
  if (/instagram\.com/i.test(query))     return 'instagram';
  if (/jiosaavn\.com/i.test(query))      return 'jiosaavn';
  if (/getyarn\.io/i.test(query))        return 'getyarn';
  if (/clyp\.it/i.test(query))           return 'clypit';
  if (/pornhub\.com/i.test(query))       return 'pornhub';
  if (/reddit\.com/i.test(query))        return 'reddit';
  if (/ocremix\.org/i.test(query))       return 'ocremix';
  if (/tiktok\.com/i.test(query))        return 'tiktok';
  if (/mixcloud\.com/i.test(query))      return 'mixcloud';
  if (/soundgasm\.net/i.test(query))     return 'soundgasm';
  if (/^https?:\/\//i.test(query))       return 'http';
  return 'youtube';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a track — paste a URL from any supported platform or type a search term')
    .addStringOption(opt =>
      opt.setName('query')
        .setDescription('URL or search term')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const query        = interaction.options.getString('query');
    const voiceChannel = interaction.guild.voiceStates.cache.get(interaction.user.id)?.channel;

    if (!voiceChannel) {
      return interaction.editReply({ content: '> You need to be in a voice channel first.' });
    }

    try {
      const engine = detectEngine(query);
      const result = await client.kazagumo.search(query, { engine, requester: interaction.user });

      if (!result?.tracks?.length) {
        return interaction.editReply({ content: `> No results found for **${query}**` });
      }

      let player = client.kazagumo.players.get(interaction.guildId);
      if (player && player.voiceId !== voiceChannel.id) { await player.destroy(); player = null; }
      if (!player) {
        player = await client.kazagumo.createPlayer({
          guildId: interaction.guildId,
          voiceId: voiceChannel.id,
          textId:  interaction.channelId,
          deaf:    true,
          volume:  200
        });
        await applyQualityFilters(player);
      }

      const isPlaylist = result.type === 'PLAYLIST';
      const tracks     = isPlaylist ? result.tracks : [result.tracks[0]];
      const wasPlaying = player.playing || player.paused;

      for (const t of tracks) player.queue.add(t);

      if (!wasPlaying) {
        client.skipNPCard.add(interaction.guildId);
        player.play();
        player.setVolume(200);
      }

      const track     = tracks[0];
      const queueSize = player.queue.length;

      if (wasPlaying) {
        const container = new ContainerBuilder();
        if (isPlaylist) {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Playlist Added to Queue'));
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**${result.playlistName ?? 'Playlist'}**\n` +
            `Added **${tracks.length} tracks** to the queue.\n\n` +
            `First track: **${track.title}**\n` +
            `Queue size: **${queueSize} track${queueSize !== 1 ? 's' : ''}**`
          ));
        } else {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Added to Queue'));
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**${track.title}**\n` +
            `by **${track.author || 'Unknown'}**  •  \`${fmtDuration(track.length)}\`\n\n` +
            `Position in queue: **#${queueSize}**`
          ));
        }
        return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      await startNPSession({
        player, track, client,
        guildId:       interaction.guildId,
        textChannelId: interaction.channelId
      });

      const replyContainer = new ContainerBuilder();
      replyContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        isPlaylist && tracks.length > 1
          ? `Playing **${result.playlistName ?? 'Playlist'}** — **${tracks.length} tracks** loaded`
          : `Playing **${track.title}**`
      ));
      return interaction.editReply({ components: [replyContainer], flags: MessageFlags.IsComponentsV2 });

    } catch (err) {
      console.error('[PLAY CMD]', err);
      await interaction.editReply({ content: `> Error: ${err.message}` });
    }
  }
};
