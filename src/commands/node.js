'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

function formatBytes(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
  if (bytes >= 1048576)    return (bytes / 1048576).toFixed(2) + ' MB';
  if (bytes >= 1024)       return (bytes / 1024).toFixed(2) + ' KB';
  return bytes + ' B';
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('node')
    .setDescription('Show Lavalink node statistics'),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const shoukaku = client.kazagumo.shoukaku;
      const nodes = [...shoukaku.nodes.values()];

      if (!nodes.length) {
        return interaction.editReply({ content: 'No Lavalink nodes are connected.' });
      }

      const lines = [];

      for (const node of nodes) {
        const s = node.stats;
        const state = node.state === 1 ? 'CONNECTED' : node.state === 2 ? 'RECONNECTING' : 'DISCONNECTED';

        lines.push(`### Node: ${node.name}  •  ${state}`);

        if (!s) {
          lines.push('Stats not yet available — node may still be warming up.');
          lines.push('');
          continue;
        }

        lines.push(
          `**Players**       ${s.players ?? 0} total  |  ${s.playingPlayers ?? 0} playing`,
          `**Uptime**        ${formatUptime(s.uptime ?? 0)}`,
          '',
          `**Memory**`,
          `  Used:           ${formatBytes(s.memory?.used ?? 0)}`,
          `  Free:           ${formatBytes(s.memory?.free ?? 0)}`,
          `  Allocated:      ${formatBytes(s.memory?.allocated ?? 0)}`,
          `  Reservable:     ${formatBytes(s.memory?.reservable ?? 0)}`,
          '',
          `**CPU**`,
          `  Cores:          ${s.cpu?.cores ?? '—'}`,
          `  System Load:    ${s.cpu?.systemLoad != null ? (s.cpu.systemLoad * 100).toFixed(2) + '%' : '—'}`,
          `  Lavalink Load:  ${s.cpu?.lavalinkLoad != null ? (s.cpu.lavalinkLoad * 100).toFixed(2) + '%' : '—'}`,
        );

        if (s.frameStats) {
          lines.push(
            '',
            `**Frame Stats**`,
            `  Sent:           ${s.frameStats.sent ?? 0}`,
            `  Nulled:         ${s.frameStats.nulled ?? 0}`,
            `  Deficit:        ${s.frameStats.deficit ?? 0}`,
          );
        }

        lines.push('');
      }

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Lavalink Node Stats'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    } catch (err) {
      console.error('[NODE CMD]', err);
      await interaction.editReply({ content: `Error fetching node stats: ${err.message}` });
    }
  }
};
