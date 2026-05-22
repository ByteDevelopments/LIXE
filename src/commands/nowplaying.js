'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { startNPSession, stopNPSession } = require('../utils/nowplaying');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing track card'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player || (!player.playing && !player.paused)) {
      return interaction.editReply({ content: '> Nothing is playing right now.' });
    }

    const track = player.queue.current;
    if (!track) return interaction.editReply({ content: '> No track data available.' });

    // Delete the deferred reply — we'll send the NP card directly to the channel
    await interaction.deleteReply().catch(() => {});

    stopNPSession(client, interaction.guildId);
    await startNPSession({
      player, track, client,
      guildId:       interaction.guildId,
      textChannelId: interaction.channelId
    });
  }
};
