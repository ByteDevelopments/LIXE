'use strict';

const {
  SlashCommandBuilder, AttachmentBuilder,
  ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder,
  TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { generateStatsCard } = require('../utils/canvas');
const { getSystemStats } = require('../utils/stats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show system statistics — bot, shards, Lavalink, and more'),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const stats = await getSystemStats(client, client.startedAt);

      const imageBuffer = await generateStatsCard(stats);
      const attachment  = new AttachmentBuilder(imageBuffer, { name: 'stats.png' });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## System Statistics'));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Live metrics for **${client.botConfig.name.toUpperCase()}** music bot`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://stats.png'))
      );
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Uptime: **${stats.uptime}**  |  CPU: **${stats.cpu}**  |  RAM: **${stats.ram}**\n` +
        `Shards: **${stats.shards}**  |  Guilds: **${stats.guilds}**  |  Active players: **${stats.activePlayers}**\n\n` +
        `**Lavalink Nodes**\n${stats.lavalinkNodes}`
      ));

      await interaction.editReply({
        files:      [attachment],
        components: [container],
        flags:      MessageFlags.IsComponentsV2
      });
    } catch (err) {
      console.error('[STATS CMD]', err);
      await interaction.editReply({ content: `Error generating stats: ${err.message}` });
    }
  }
};
