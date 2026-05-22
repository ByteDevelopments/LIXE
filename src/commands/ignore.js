'use strict';

const {
  SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  PermissionFlagsBits, MessageFlags
} = require('discord.js');
const { addIgnoredChannel, removeIgnoredChannel, getIgnoredChannels } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ignore')
    .setDescription('Ignore or un-ignore a channel — bot commands will not work in ignored channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to toggle (defaults to current channel)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const channel   = interaction.options.getChannel('channel') ?? interaction.channel;
    const clientId  = client.botConfig.clientId;
    const guildId   = interaction.guildId;
    const channelId = channel.id;

    const current = getIgnoredChannels(guildId, clientId);
    const isIgnored = current.includes(channelId);

    if (isIgnored) {
      removeIgnoredChannel(guildId, clientId, channelId);
    } else {
      addIgnoredChannel(guildId, clientId, channelId);
    }

    const allIgnored = getIgnoredChannels(guildId, clientId);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      isIgnored ? '## Channel Un-ignored' : '## Channel Ignored'
    ));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      isIgnored
        ? `Commands are now **enabled** in <#${channelId}>.`
        : `Commands are now **disabled** in <#${channelId}>.`
    ));

    if (allIgnored.length) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Currently ignored channels:\n${allIgnored.map(id => `<#${id}>`).join('  ')}`
      ));
    }

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
