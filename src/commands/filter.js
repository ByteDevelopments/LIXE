'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { FILTERS, FILTER_INFO } = require('../utils/filters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Apply an audio filter to the player')
    .addStringOption(opt =>
      opt.setName('preset')
        .setDescription('Choose a filter preset')
        .setRequired(true)
        .addChoices(
          { name: 'Bass Boost',    value: 'bassboost'  },
          { name: 'Lo-Fi',         value: 'lofi'       },
          { name: 'Slow + Reverb', value: 'slowreverb' },
          { name: 'Nightcore',     value: 'nightcore'  },
          { name: 'Low Pass',      value: 'lowpass'    },
          { name: 'High Pass',     value: 'highpass'   },
          { name: 'Reset (HQ)',    value: 'reset'      }
        )
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.players.get(interaction.guildId);
    if (!player) {
      return interaction.editReply({ content: '> No active player. Use `/play` first.' });
    }

    const preset = interaction.options.getString('preset');
    const fn     = FILTERS[preset];
    if (!fn) return interaction.editReply({ content: '> Unknown filter.' });

    try {
      await fn(player);
      client.activeFilter.set(interaction.guildId, preset);

      const info = FILTER_INFO[preset];
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Filter: ${info.label}`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${info.description}\n\nActive preset: **${info.label}**  •  Use \`/filter preset:Reset (HQ)\` to remove filters.`
      ));
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      console.error('[FILTER CMD]', err);
      await interaction.editReply({ content: `> Error applying filter: ${err.message}` });
    }
  }
};
