'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the player volume (50 to 200)')
    .addIntegerOption(opt =>
      opt.setName('level')
        .setDescription('Volume level between 50 and 200')
        .setMinValue(50)
        .setMaxValue(200)
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player) {
      return interaction.editReply({ content: '> No active player. Use `/play` first.' });
    }

    const level = interaction.options.getInteger('level');
    player.setVolume(level);

    // Build a simple visual bar
    const filled = Math.round((level - 50) / 150 * 20);
    const bar = '[' + '#'.repeat(filled) + '-'.repeat(20 - filled) + ']';

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Volume'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Volume set to **${level}%**\n\`${bar}\``
    ));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
