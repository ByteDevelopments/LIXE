'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

function parseTime(input) {
  // Accepts: 90  (seconds)  |  1:30  (m:ss)  |  1:05:30  (h:mm:ss)
  if (/^\d+$/.test(input)) return parseInt(input, 10) * 1000;
  const parts = input.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  return null;
}

function fmtMs(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a position in the current track')
    .addStringOption(opt =>
      opt.setName('position')
        .setDescription('Time to seek to — e.g. 90  or  1:30  or  1:05:00')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player || (!player.playing && !player.paused)) {
      return interaction.editReply({ content: 'Nothing is playing right now.' });
    }

    const track = player.queue.current;
    if (!track) return interaction.editReply({ content: 'No current track found.' });

    if (!track.length) {
      return interaction.editReply({ content: 'Cannot seek on a live stream.' });
    }

    const input = interaction.options.getString('position').trim();
    const ms = parseTime(input);

    if (ms === null) {
      return interaction.editReply({ content: 'Invalid time format. Use `90` (seconds), `1:30` (m:ss), or `1:05:00` (h:mm:ss).' });
    }

    if (ms < 0 || ms > track.length) {
      return interaction.editReply({ content: `Position out of range. Track length is **${fmtMs(track.length)}**.` });
    }

    await player.seek(ms);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Seeked'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Jumped to **${fmtMs(ms)}** / **${fmtMs(track.length)}** in **${track.title}**`
    ));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
