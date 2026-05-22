'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode for the player')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Track — repeat current track', value: 'track' },
          { name: 'Queue — repeat entire queue',  value: 'queue' },
          { name: 'Off — disable looping',        value: 'none'  }
        )
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player) {
      return interaction.editReply({ content: '> No active player. Use `/play` first.' });
    }

    const mode = interaction.options.getString('mode');
    player.setLoop(mode); // 'track' | 'queue' | 'none'

    const labels = { track: 'Track loop', queue: 'Queue loop', none: 'Loop disabled' };
    const descs  = {
      track: 'The current track will repeat indefinitely.',
      queue: 'The entire queue will repeat from the beginning when it ends.',
      none:  'Looping is now off.'
    };

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${labels[mode]}`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(descs[mode]));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
