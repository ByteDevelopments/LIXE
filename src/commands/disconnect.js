'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { remove247 } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect the radio bot from the voice channel'),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const voiceChannel = interaction.guild.voiceStates.cache.get(interaction.user.id)?.channel;
      const player = client.kazagumo.players.get(interaction.guildId);
      const is247 = client.twoFourSeven.get(interaction.guildId);

      if (!player && !is247) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Not Connected'));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**${client.botConfig.name.toUpperCase()}** is not currently in any voice channel.`
        ));
        return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      if (is247) {
        // 24/7 is active — disconnect but bot will auto-rejoin
        if (player) await player.destroy();

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Disconnected — 24/7 Active'));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**${client.botConfig.name.toUpperCase()}** has been disconnected but **24/7 mode is still active**.\nThe bot will automatically rejoin <#${is247.voiceId}> shortly.\n\nTo fully stop the bot, use \`/247\` to disable 24/7 mode first, then \`/disconnect\`.`
        ));
        return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      // 24/7 is off — fully disconnect
      client.twoFourSeven.delete(interaction.guildId);
      remove247(interaction.guildId, client.botConfig.clientId);
      if (player) await player.destroy();

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Disconnected'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**${client.botConfig.name.toUpperCase()}** has been disconnected from the voice channel.`
      ));

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    } catch (err) {
      console.error('[DISCONNECT CMD]', err);
      await interaction.editReply({ content: `Error disconnecting: ${err.message}` });
    }
  }
};
