'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { stopNPSession } = require('../utils/nowplaying');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Replay the previous track'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player) {
      return interaction.editReply({ content: '> No active player.' });
    }

    const last = client.lastTrack.get(interaction.guildId);
    if (!last) {
      return interaction.editReply({ content: '> No previous track in this session.' });
    }

    // Put the previous track at the front of the queue and skip the current one
    player.queue.unshift(last);
    stopNPSession(client, interaction.guildId);
    player.skip();

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Playing Previous'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Going back to **${last.title}** by **${last.author || 'Unknown'}**.`
    ));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
