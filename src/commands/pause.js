'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { refreshNPMessage } = require('../utils/nowplaying');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current track'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player || !player.playing) {
      return interaction.editReply({ content: '> Nothing is playing right now.' });
    }
    if (player.paused) {
      return interaction.editReply({ content: '> Already paused. Use `/resume` to continue.' });
    }

    player.pause(true);
    await refreshNPMessage(client, interaction.guildId);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Paused'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Paused **${player.queue.current?.title ?? 'the track'}**.\nUse \`/resume\` to continue.`
    ));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
