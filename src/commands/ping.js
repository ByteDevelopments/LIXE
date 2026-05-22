'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency and API response time'),

  async execute(interaction, client) {
    const before = Date.now();
    await interaction.deferReply();
    const after = Date.now();

    const ws  = client.ws.ping;
    const api = after - before;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Ping'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `WebSocket latency: **${ws}ms**\nAPI response time: **${api}ms**`
    ));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
