'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('replay')
    .setDescription('Replay the current track from the beginning'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player || (!player.playing && !player.paused)) {
      return interaction.editReply({ content: 'Nothing is playing right now.' });
    }

    const track = player.queue.current;
    if (!track) return interaction.editReply({ content: 'No current track found.' });

    if (!track.length) {
      return interaction.editReply({ content: 'Cannot replay a live stream.' });
    }

    await player.seek(0);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Replaying'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Restarted **${track.title}** from the beginning.`
    ));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
