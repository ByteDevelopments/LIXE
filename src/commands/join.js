'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { joinChannel } = require('../bot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your current voice channel'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const voiceChannel = interaction.guild.voiceStates.cache.get(interaction.user.id)?.channel;
    if (!voiceChannel) {
      return interaction.editReply({ content: '> You need to be in a voice channel first.' });
    }

    try {
      await joinChannel(client, interaction.guildId, voiceChannel.id, interaction.channelId);

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Joined'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Joined **${voiceChannel.name}**.\nUse \`/play\` to start playing music.`
      ));
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      await interaction.editReply({ content: `> Error joining channel: ${err.message}` });
    }
  }
};
