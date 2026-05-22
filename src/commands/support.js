'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get the support server invite link'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const invite = client.botConfig.supportInvite ?? 'Not configured';
    const serverId = client.botConfig.supportServerId;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Support'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Need help with **${client.botConfig.name.toUpperCase()}**?\n\n` +
      `Join the support server: ${invite}` +
      (serverId ? `\nServer ID: \`${serverId}\`` : '')
    ));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
