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
    .setName('restart')
    .setDescription('[Owner] Gracefully restart all bot instances'),

  async execute(interaction, client) {
    // ── Guard: owner only, dev guild only ─────────────────────────────────
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: '> ❌ This command is restricted to the bot owner.', ephemeral: true });
    }
    if (interaction.guildId !== DEV_GUILD) {
      return interaction.reply({ content: '> ❌ This command can only be used in the owner/dev guild.', ephemeral: true });
    }

    await interaction.deferReply();

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🔄 Restart Initiated'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Restarting **${client.botConfig.name.toUpperCase()}**...\n\n` +
      `> Destroying active players and disconnecting shards.\n` +
      `> Process will exit and your process manager (PM2 / systemd) will bring it back online.\n\n` +
      `-# Initiated by <@${interaction.user.id}> at <t:${Math.floor(Date.now() / 1000)}:T>`
    ));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    // Log to shard log channel
    try {
      const logCh = await client.channels.fetch(LOG_CHANNEL).catch(() => null);
      if (logCh) {
        const logContainer = new ContainerBuilder();
        logContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `### 🔄 Restart\n` +
          `Bot **${client.botConfig.name.toUpperCase()}** is restarting.\n` +
          `-# Triggered by <@${interaction.user.id}> at <t:${Math.floor(Date.now() / 1000)}:F>`
        ));
        await logCh.send({ components: [logContainer], flags: MessageFlags.IsComponentsV2 });
      }
    } catch { /* silent */ }

    // Graceful teardown — destroy all active players first
    try {
      for (const [, player] of client.kazagumo.players) {
        await player.destroy().catch(() => {});
      }
    } catch { /* silent */ }

    // Short delay so the reply can be sent before exit
    setTimeout(() => process.exit(0), 1500);
  }
};
