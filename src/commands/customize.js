'use strict';

/**
 * /customize — Change the bot's avatar and/or banner
 * Owner only · Works from ANY guild (no guild restriction)
 * Logs changes to the shard log channel
 */

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');

const OWNER_ID    = '1032944901412880394';
const LOG_CHANNEL = '1487631718059086037';

// ── Fetch remote image → base64 data-URI ─────────────────────────────────────
function fetchAsBase64(url) {
  const https    = require('https');
  const http     = require('http');
  const { URL }  = require('url');

  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const protocol = parsed.protocol === 'https:' ? https : http;

    const req = protocol.get(url, (res) => {
      // Follow one redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return fetchAsBase64(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf  = Buffer.concat(chunks);
        const mime = res.headers['content-type']?.split(';')[0] || 'image/png';
        resolve(`data:${mime};base64,${buf.toString('base64')}`);
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10_000, () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

// ── Log helper ────────────────────────────────────────────────────────────────
async function logToChannel(client, blocks) {
  try {
    const ch = await client.channels.fetch(LOG_CHANNEL).catch(() => null);
    if (!ch) return;
    const c = new ContainerBuilder();
    for (let i = 0; i < blocks.length; i++) {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(blocks[i]));
      if (i < blocks.length - 1) {
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      }
    }
    await ch.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
  } catch { /* silent */ }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('customize')
    .setDescription('[Owner] Change the bot\'s avatar and/or banner — usable from any server')
    .addStringOption(opt =>
      opt.setName('pfp')
         .setDescription('Direct image URL for the new bot avatar (PNG/JPG/GIF/WEBP)')
         .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('banner')
         .setDescription('Direct image URL for the new bot banner (requires bot Nitro)')
         .setRequired(false)
    ),

  async execute(interaction, client) {
    // ── Guard: owner only (any guild) ─────────────────────────────────────
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '> 🔒 This command is restricted to the bot owner.',
        ephemeral: true
      });
    }

    const pfpUrl    = interaction.options.getString('pfp');
    const bannerUrl = interaction.options.getString('banner');

    if (!pfpUrl && !bannerUrl) {
      return interaction.reply({
        content: '> ⚠️ Provide at least one option — `pfp` or `banner`.',
        ephemeral: true
      });
    }

    // Validate before deferring
    if (pfpUrl && !isValidUrl(pfpUrl)) {
      return interaction.reply({
        content: '> ❌ Invalid **pfp** URL — must be a direct `http://` or `https://` image link.',
        ephemeral: true
      });
    }
    if (bannerUrl && !isValidUrl(bannerUrl)) {
      return interaction.reply({
        content: '> ❌ Invalid **banner** URL — must be a direct `http://` or `https://` image link.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const ts      = Math.floor(Date.now() / 1000);
    const results = [];
    let   pfpOk   = false;

    // ── Change avatar ──────────────────────────────────────────────────────
    if (pfpUrl) {
      try {
        const dataUri = await fetchAsBase64(pfpUrl);
        await client.user.setAvatar(dataUri);
        results.push(`🖼️  **Avatar** — Updated successfully ✅`);
        pfpOk = true;
      } catch (err) {
        results.push(`🖼️  **Avatar** — Failed ❌\n-# ${err.message}`);
      }
    }

    // ── Change banner ──────────────────────────────────────────────────────
    if (bannerUrl) {
      try {
        const dataUri = await fetchAsBase64(bannerUrl);
        await client.user.setBanner(dataUri);
        results.push(`🏞️  **Banner** — Updated successfully ✅`);
      } catch (err) {
        const isNitro = /nitro|premium|boost/i.test(err.message);
        if (isNitro) {
          results.push(`🏞️  **Banner** — ❌ Bot account requires Discord Nitro to set a banner`);
        } else {
          results.push(`🏞️  **Banner** — Failed ❌\n-# ${err.message}`);
        }
      }
    }

    // ── Reply ──────────────────────────────────────────────────────────────
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `### 🎨 Bot Customization`
    ));

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      results.join('\n')
    ));

    // Show new avatar preview if successful
    if (pfpOk) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      // Use fresh avatar URL from Discord after the update
      const avatarUrl = client.user.displayAvatarURL({ size: 256, extension: 'png' });
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder()
            .setURL(avatarUrl)
            .setDescription('New bot avatar')
        )
      );
    }

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `-# Changed by <@${interaction.user.id}> in **${interaction.guild?.name ?? 'DM'}** at <t:${ts}:T>`
    ));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    // ── Log to shard channel ───────────────────────────────────────────────
    await logToChannel(client, [
      [
        `### 🎨 Bot Customized`,
        `**Bot:** \`${client.botConfig.name.toUpperCase()}\``,
        `**By:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)`,
        `**Guild:** ${interaction.guild?.name ?? 'DM'} (\`${interaction.guildId ?? 'N/A'}\`)`,
        `**Time:** <t:${ts}:F>`,
      ].join('\n'),
      [
        results.join('\n'),
        pfpUrl    ? `\n-# PFP URL: ${pfpUrl}`    : '',
        bannerUrl ? `\n-# Banner URL: ${bannerUrl}` : '',
      ].filter(Boolean).join(''),
    ]);
  }
};
