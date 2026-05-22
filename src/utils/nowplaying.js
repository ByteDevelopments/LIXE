'use strict';

const {
  AttachmentBuilder, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder,
  TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags
} = require('discord.js');
const { generateNowPlayingCard } = require('./canvas');

function getYtThumbnail(uri) {
  if (!uri) return null;
  const m = uri.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  if (!m) return null;
  return `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg`;
}

/**
 * Build Components V2 container for the NP message.
 * imageUrl — CDN URL of the already-uploaded card (reused on edits to avoid re-upload).
 */
function buildComponents(player, client, guildId, imageUrl) {
  const upcoming = [...player.queue];
  const isPaused = player.paused;

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Now Playing'));
  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(imageUrl)
    )
  );

  const infoLine = `Use \`/queue\` to see upcoming tracks${client.autoplay.get(guildId) ? '  •  Autoplay **ON**' : ''}`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(infoLine));
  container.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1));

  // Play/Pause toggle — emoji reflects current playback state
  const toggleEmoji = isPaused
    ? { id: '1483342283930861568', name: 'play' }   // paused → show ▶ play
    : { id: '1482629617872273529', name: 'pause' };  // playing → show ⏸ pause

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`np_toggle:${guildId}`)
        .setEmoji(toggleEmoji)
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`np_skip:${guildId}`)
        .setEmoji({ id: '1482629639460491285', name: 'next' })
        .setStyle(ButtonStyle.Secondary)
    )
  );

  // Queue select — disabled when empty
  const options = upcoming.slice(0, 25).map((t, i) =>
    new StringSelectMenuOptionBuilder()
      .setLabel((t.title || 'Unknown').slice(0, 100))
      .setDescription((t.author || 'Unknown Artist').slice(0, 100))
      .setValue(String(i))
  );
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`np_queue:${guildId}`)
    .setPlaceholder(upcoming.length ? 'Select a song to jump to…' : 'Queue is empty')
    .setDisabled(upcoming.length === 0);

  if (options.length) {
    selectMenu.addOptions(options);
  } else {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Queue is empty').setValue('empty')
    );
  }
  container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));

  return container;
}

/**
 * Start a Now Playing session:
 * 1. Generates the canvas card image
 * 2. Sends it to the text channel
 * 3. Stores the message reference
 * 4. Starts a 5-second refresh interval for button/queue state updates
 */
async function startNPSession({ player, track, client, guildId, textChannelId } = {}) {
  // Always stop any existing session first to prevent duplicate intervals
  stopNPSession(client, guildId);

  try {
    const textId = textChannelId ?? player.textId;
    if (!textId) return;

    const channel = await client.channels.fetch(textId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const guild     = client.guilds.cache.get(guildId);
    const vc        = guild?.channels.cache.get(player.voiceId);
    const requester = track.requester?.username ?? track.requester?.tag ?? '?';

    const imageBuffer = await generateNowPlayingCard({
      title:        track.title  || 'Unknown Track',
      author:       track.author || 'Unknown Artist',
      duration:     track.length || 0,
      botName:      client.botConfig.name,
      channelName:  vc?.name ?? 'Voice',
      requester,
      queueSize:    player.queue.length,
      volume:       200,
      thumbnailUrl: getYtThumbnail(track.uri)
    });

    const attachment = new AttachmentBuilder(imageBuffer, { name: 'nowplaying.png' });
    const container  = buildComponents(player, client, guildId, 'attachment://nowplaying.png');

    const message = await channel.send({
      files:      [attachment],
      components: [container],
      flags:      MessageFlags.IsComponentsV2
    });

    client.npMessages.set(guildId, message);

    // Refresh every 5 seconds — keeps pause/resume button and queue select in sync
    const interval = setInterval(() => refreshNPMessage(client, guildId), 5000);
    client.npIntervals.set(guildId, interval);

  } catch (err) {
    console.error('[NP SESSION]', err.message);
  }
}

/**
 * Edit the NP message in-place.
 * Reuses the CDN URL of the original uploaded image — no re-upload needed.
 * Only updates the button state and queue select menu.
 */
async function refreshNPMessage(client, guildId) {
  const message = client.npMessages?.get(guildId);
  if (!message) return;

  const player = client.kazagumo?.players.get(guildId);
  if (!player) return stopNPSession(client, guildId);

  const track = player.queue.current;
  if (!track) return; // queue empty — keep last card visible until playerEmpty clears it

  // Reuse the already-uploaded CDN attachment URL
  const imgUrl = message.attachments.first()?.url;
  if (!imgUrl) return;

  try {
    const container = buildComponents(player, client, guildId, imgUrl);
    await message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } catch {
    // Message may have been deleted; clean up gracefully
    stopNPSession(client, guildId);
  }
}

/**
 * Stop the refresh interval and drop the stored message reference.
 * Call before creating a new session, on playerEmpty, or on player destroy.
 */
function stopNPSession(client, guildId) {
  const interval = client.npIntervals?.get(guildId);
  if (interval) {
    clearInterval(interval);
    client.npIntervals.delete(guildId);
  }
  client.npMessages?.delete(guildId);
}

module.exports = { startNPSession, stopNPSession, refreshNPMessage, getYtThumbnail };
