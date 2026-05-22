'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  MessageFlags
} = require('discord.js');

const OWNER_ID    = '1032944901412880394';
const DEV_GUILD   = '1482191847366594570';
const LOG_CHANNEL = '1487631718059086037';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reconnect')
    .setDescription('[Owner] Reconnect all shards and Lavalink nodes'),

  async execute(interaction, client) {
    // ── Guard: owner only, dev guild only ─────────────────────────────────
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: '> ❌ This command is restricted to the bot owner.', ephemeral: true });
    }
    if (interaction.guildId !== DEV_GUILD) {
      return interaction.reply({ content: '> ❌ This command can only be used in the owner/dev guild.', ephemeral: true });
    }

    await interaction.deferReply();

    const lines = ['## 🔌 Reconnecting...\n'];

    // ── Reconnect all Discord.js shards ───────────────────────────────────
    const shardResults = [];
    if (client.ws && client.ws.shards && client.ws.shards.size > 0) {
      lines.push('### Discord Shards');
      for (const [id, shard] of client.ws.shards) {
        try {
          shard.destroy({ recover: true });
          shardResults.push(`  Shard **${id}** — reconnect triggered ✅`);
        } catch (err) {
          shardResults.push(`  Shard **${id}** — failed: ${err.message} ❌`);
        }
      }
      lines.push(...shardResults, '');
    } else {
      lines.push('### Discord Shards');
      lines.push('  Single process mode — no manual shard reconnect needed ✅', '');
    }

    // ── Reconnect all Lavalink nodes ─────────────────────────────────────
    lines.push('### Lavalink Nodes');
    const shoukaku  = client.kazagumo.shoukaku;
    const nodeList  = [...shoukaku.nodes.values()];

    if (!nodeList.length) {
      lines.push('  No Lavalink nodes registered ⚠️', '');
    } else {
      for (const node of nodeList) {
        try {
          // Disconnect first, then reconnect
          if (node.ws) {
            node.ws.close(1000, 'Manual reconnect');
          }
          // Shoukaku will auto-reconnect via its internal reconnect logic
          lines.push(`  Node **${node.name}** (${node.url}) — reconnect triggered ✅`);
        } catch (err) {
          lines.push(`  Node **${node.name}** — failed: ${err.message} ❌`);
        }
      }
      lines.push('');
    }

    lines.push(`-# Initiated by <@${interaction.user.id}> at <t:${Math.floor(Date.now() / 1000)}:T>`);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    // ── Log to shard log channel ──────────────────────────────────────────
    try {
      const logCh = await client.channels.fetch(LOG_CHANNEL).catch(() => null);
      if (logCh) {
        const summary = [
          `**Shards:** ${shardResults.length || 'N/A (single process)'}`,
          `**Lavalink nodes:** ${nodeList.map(n => n.name).join(', ') || 'none'}`
        ].join(' · ');

        const logContainer = new ContainerBuilder();
        logContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `### 🔌 Reconnect\n` +
          `${summary}\n` +
          `-# Triggered by <@${interaction.user.id}> at <t:${Math.floor(Date.now() / 1000)}:F>`
        ));
        await logCh.send({ components: [logContainer], flags: MessageFlags.IsComponentsV2 });
      }
    } catch { /* silent */ }
  }
};
