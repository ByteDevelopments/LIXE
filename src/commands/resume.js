'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { refreshNPMessage } = require('../utils/nowplaying');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused track'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player || (!player.playing && !player.paused)) {
      return interaction.editReply({ content: '> Nothing is playing right now.' });
    }
    if (!player.paused) {
      return interaction.editReply({ content: '> Not paused. Music is already playing.' });
    }

    player.pause(false);
    await refreshNPMessage(client, interaction.guildId);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Resumed'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Resumed **${player.queue.current?.title ?? 'the track'}**.`
    ));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
