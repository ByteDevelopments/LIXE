'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { stopNPSession } = require('../utils/nowplaying');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track')
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of tracks to skip (default: 1)')
        .setMinValue(1).setMaxValue(50).setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player || (!player.playing && !player.paused)) {
      return interaction.editReply({ content: '> Nothing is playing right now.' });
    }

    const amount       = interaction.options.getInteger('amount') ?? 1;
    const currentTitle = player.queue.current?.title ?? 'Unknown';

    if (amount > 1) {
      const toRemove = Math.min(amount - 1, player.queue.length);
      player.queue.splice(0, toRemove);
    }

    stopNPSession(client, interaction.guildId);
    player.skip();

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Skipped'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Skipped **${amount > 1 ? `${amount} tracks` : `"${currentTitle}"`}**`
    ));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
