'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  MessageFlags
} = require('discord.js');
const { applyQualityFilters } = require('../utils/filters');
const { startNPSession } = require('../utils/nowplaying');

function fmtDuration(ms) {
  if (!ms || ms <= 0) return 'LIVE';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for a song and pick from results')
    .addStringOption(opt =>
      opt.setName('query').setDescription('Song name or keywords').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('platform')
        .setDescription('Platform to search on (default: YouTube)')
        .setRequired(false)
        .addChoices(
          { name: 'YouTube',    value: 'youtube' },
          { name: 'SoundCloud', value: 'soundcloud' },
          { name: 'Spotify',    value: 'spotify' },
          { name: 'Deezer',     value: 'deezer' },
          { name: 'Apple Music',value: 'applemusic' },
          { name: 'Yandex Music', value: 'yandexmusic' }
        )
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const query    = interaction.options.getString('query');
    const platform = interaction.options.getString('platform') ?? 'youtube';
    const voiceChannel = interaction.guild.voiceStates.cache.get(interaction.user.id)?.channel;

    if (!voiceChannel) {
      return interaction.editReply({ content: '> You need to be in a voice channel first.' });
    }

    try {
      const result = await client.kazagumo.search(query, { engine: platform, requester: interaction.user });

      if (!result?.tracks?.length) {
        return interaction.editReply({ content: `> No results found for **${query}** on ${platform}.` });
      }

      const topTracks = result.tracks.slice(0, 10);

      const options = topTracks.map((t, i) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${i + 1}. ${(t.title || 'Unknown').slice(0, 90)}`)
          .setDescription(`${(t.author || 'Unknown Artist').slice(0, 60)}  •  ${fmtDuration(t.length)}`)
          .setValue(String(i))
      );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`search_pick:${interaction.guildId}:${interaction.user.id}`)
        .setPlaceholder('Select a track to play...')
        .addOptions(options);

      client.searchResults.set(
        `${interaction.guildId}:${interaction.user.id}`,
        { tracks: topTracks, voiceChannelId: voiceChannel.id, expiresAt: Date.now() + 60_000 }
      );

      const platformLabel = {
        youtube: 'YouTube', soundcloud: 'SoundCloud', spotify: 'Spotify',
        deezer: 'Deezer', applemusic: 'Apple Music', yandexmusic: 'Yandex Music'
      }[platform] ?? platform;

      const lines = topTracks.map((t, i) =>
        `\`${String(i + 1).padStart(2, ' ')}.\` **${(t.title || 'Unknown').slice(0, 55)}**  \`${fmtDuration(t.length)}\`\n    by **${(t.author || 'Unknown').slice(0, 40)}**`
      );

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## Search Results — ${platformLabel}\nQuery: **${query}**`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1));
      container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    } catch (err) {
      console.error('[SEARCH CMD]', err);
      await interaction.editReply({ content: `> Error: ${err.message}` });
    }
  }
};
