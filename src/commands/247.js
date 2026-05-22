'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js');

const { save247, remove247 } = require('../utils/db');
const { joinChannel } = require('../bot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Toggle 24/7 mode - bot stays in voice channel and auto-rejoins'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const voiceChannel =
      interaction.guild.voiceStates.cache.get(interaction.user.id)?.channel;

    if (!voiceChannel) {
      return interaction.editReply({
        content: 'You must be in a voice channel to use this command.',
        ephemeral: true
      });
    }

    const current = client.twoFourSeven.get(interaction.guildId);

    // Disable 24/7
    if (current) {
      client.twoFourSeven.delete(interaction.guildId);

      remove247(
        interaction.guildId,
        client.botConfig.clientId
      );

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent('## 24/7 Mode Disabled')
      );

      container.addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(1)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `24/7 mode has been turned off for **${client.botConfig.name.toUpperCase()}**.\nThe bot will no longer auto-rejoin the voice channel.`
        )
      );

      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // Enable 24/7
    client.twoFourSeven.set(interaction.guildId, {
      voiceId: voiceChannel.id,
      textId: interaction.channelId
    });

    save247(
      interaction.guildId,
      client.botConfig.clientId,
      voiceChannel.id,
      interaction.channelId
    );

    await joinChannel(
      client,
      interaction.guildId,
      voiceChannel.id,
      interaction.channelId
    );

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent('## 24/7 Mode Enabled')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${client.botConfig.name.toUpperCase()}** will now stay in **${voiceChannel.name}** continuously.\nThe bot will auto-rejoin if disconnected and will resume after restarts.\n\nUse \`/play\` to start playing music.`
      )
    );

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};