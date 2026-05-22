'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

const PAGE_SIZE = 10;

function fmtDuration(ms) {
  if (!ms || ms <= 0) return 'LIVE';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function totalDuration(tracks) {
  const ms = tracks.reduce((acc, t) => acc + (t.length || 0), 0);
  if (!ms) return '?';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue')
    .addIntegerOption(opt =>
      opt.setName('page')
        .setDescription('Page number (default: 1)')
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || (!player.queue.current && !player.queue.length)) {
      return interaction.editReply({ content: 'Nothing is playing right now. Use `/play` to start some music.' });
    }

    const current = player.queue.current;
    const upcoming = [...player.queue];
    const page = Math.max(1, interaction.options.getInteger('page') ?? 1);
    const totalPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
    const clampedPage = Math.min(page, totalPages);
    const start = (clampedPage - 1) * PAGE_SIZE;
    const slice = upcoming.slice(start, start + PAGE_SIZE);

    // ── Build content ─────────────────────────────────────────────────────
    const lines = [];

    // Current track
    lines.push('### Now Playing');
    if (current) {
      const dur = fmtDuration(current.length);
      const req = current.requester?.username ?? current.requester?.tag ?? '?';
      lines.push(`**[${current.title}](${current.uri ?? 'https://discord.com'})**`);
      lines.push(`by **${current.author || 'Unknown'}**  •  \`${dur}\`  •  req. **${req}**`);
    } else {
      lines.push('*Nothing*');
    }

    lines.push('');

    if (!upcoming.length) {
      lines.push('*Queue is empty — autoplay will pick the next track if enabled.*');
    } else {
      lines.push(`### Up Next  *(${upcoming.length} track${upcoming.length !== 1 ? 's' : ''}, ${totalDuration(upcoming)} total)*`);

      for (let i = 0; i < slice.length; i++) {
        const t = slice[i];
        const pos = start + i + 1;
        const dur = fmtDuration(t.length);
        const req = t.requester?.username ?? t.requester?.tag ?? '?';
        const titleText = t.title.length > 52 ? t.title.slice(0, 52) + '…' : t.title;
        lines.push(`\`${String(pos).padStart(2, ' ')}.\` **${titleText}**  \`${dur}\`  — ${req}`);
      }

      if (totalPages > 1) {
        lines.push('');
        lines.push(`Page **${clampedPage}** / **${totalPages}**  •  Use \`/queue page:${clampedPage + 1}\` to see more`);
      }
    }

    // ── Autoplay & looping status footer ─────────────────────────────────
    const flags = [];
    if (client.autoplay.get(interaction.guildId)) flags.push('Autoplay ON');
    if (player.loop === 'track') flags.push('Loop: Track');
    if (player.loop === 'queue') flags.push('Loop: Queue');
    if (flags.length) lines.push('', `*${flags.join('  •  ')}*`);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Queue — ${client.botConfig.name.toUpperCase()}`)
    );
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
