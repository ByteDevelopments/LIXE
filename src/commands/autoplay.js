'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay — automatically queues related tracks when the queue ends'),
  // No setDefaultMemberPermissions → any server member can use this

  async execute(interaction, client) {
    await interaction.deferReply();

    const current = client.autoplay.get(interaction.guildId) ?? false;
    const next    = !current;
    client.autoplay.set(interaction.guildId, next);

    const container = new ContainerBuilder();

    if (next) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Autoplay Enabled'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**${client.botConfig.name.toUpperCase()}** will now automatically queue related tracks when the queue runs out.\n\nUse \`/autoplay\` again to disable.`
      ));
    } else {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Autoplay Disabled'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Autoplay has been turned off for **${client.botConfig.name.toUpperCase()}**.\nThe bot will stop when the queue is empty.`
      ));
    }

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
