'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { stopNPSession } = require('../utils/nowplaying');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue (bot stays in channel)'),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const player = client.kazagumo.players.get(interaction.guildId);

      if (!player || (!player.playing && !player.paused)) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Nothing Playing'));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**${client.botConfig.name.toUpperCase()}** is not currently playing anything.`
        ));
        return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      stopNPSession(client, interaction.guildId);
      player.queue.clear();
      await player.skip();

      const is247 = client.twoFourSeven.get(interaction.guildId);

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Playback Stopped'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**${client.botConfig.name.toUpperCase()}** has stopped playing.\n${
          is247
            ? '24/7 mode is still active — use `/247` to disable it.'
            : 'Use `/play` to start music again.'
        }`
      ));

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    } catch (err) {
      console.error('[STOP CMD]', err);
      await interaction.editReply({ content: `> Error stopping playback: ${err.message}` });
    }
  }
};
