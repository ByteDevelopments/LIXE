'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SectionBuilder, ThumbnailBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');

function ts(date) {
  const s = Math.floor(date.getTime() / 1000);
  return `<t:${s}:F>  (<t:${s}:R>)`;
}

function getHighestRole(member) {
  return member.roles.cache
    .filter(r => r.id !== member.guild.id)
    .sort((a, b) => b.position - a.position)
    .first() ?? null;
}

function getUserFlags(user) {
  const map = {
    Staff:                 'Discord Staff',
    Partner:               'Discord Partner',
    Hypesquad:             'HypeSquad Events',
    BugHunterLevel1:       'Bug Hunter Level 1',
    BugHunterLevel2:       'Bug Hunter Level 2',
    HypeSquadOnlineHouse1: 'HypeSquad Bravery',
    HypeSquadOnlineHouse2: 'HypeSquad Brilliance',
    HypeSquadOnlineHouse3: 'HypeSquad Balance',
    PremiumEarlySupporter: 'Early Supporter',
    VerifiedDeveloper:     'Verified Bot Developer',
    VerifiedBot:           'Verified Bot',
    CertifiedModerator:    'Discord Certified Moderator',
    ActiveDeveloper:       'Active Developer',
  };
  return (user.flags?.toArray() ?? []).map(f => map[f] ?? f);
}

function getStatus(member) {
  const s = member.presence?.status;
  const map = { online: 'Online', idle: 'Idle', dnd: 'Do Not Disturb', offline: 'Offline / Unknown', invisible: 'Invisible' };
  return map[s] ?? 'Offline / Unknown';
}

function getActivity(member) {
  const acts = member.presence?.activities ?? [];
  const typeNames = ['Playing', 'Streaming', 'Listening to', 'Watching', 'Custom', 'Competing in'];
  for (const a of acts) {
    if (a.type === 4) return a.state ? `Custom Status: ${a.state}` : null;
    return `${typeNames[a.type] ?? ''} **${a.name}**${a.details ? ` — ${a.details}` : ''}`;
  }
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show detailed information about a user')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to look up (defaults to yourself)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('user') ?? interaction.user;
      const isSelf     = targetUser.id === interaction.user.id;
      const fullUser   = await client.users.fetch(targetUser.id, { force: true });

      let member = null;
      try { member = await interaction.guild.members.fetch(targetUser.id); } catch {}

      const avatarUrl   = member?.displayAvatarURL({ size: 256, extension: 'png' }) ?? fullUser.displayAvatarURL({ size: 256, extension: 'png' });
      const bannerUrl   = fullUser.bannerURL?.({ size: 1024, extension: 'png' }) ?? null;
      const badges      = getUserFlags(fullUser);
      const highestRole = member ? getHighestRole(member) : null;
      const roles       = member
        ? [...member.roles.cache.filter(r => r.id !== interaction.guildId).sort((a, b) => b.position - a.position).values()]
        : [];

      const keyPerms = [];
      if (member) {
        const p = member.permissions;
        if (p.has('Administrator'))   keyPerms.push('Administrator');
        if (p.has('ManageGuild'))     keyPerms.push('Manage Server');
        if (p.has('ManageRoles'))     keyPerms.push('Manage Roles');
        if (p.has('ManageChannels'))  keyPerms.push('Manage Channels');
        if (p.has('ManageMessages'))  keyPerms.push('Manage Messages');
        if (p.has('ManageNicknames')) keyPerms.push('Manage Nicknames');
        if (p.has('KickMembers'))     keyPerms.push('Kick Members');
        if (p.has('BanMembers'))      keyPerms.push('Ban Members');
        if (p.has('MentionEveryone')) keyPerms.push('Mention Everyone');
        if (p.has('ModerateMembers')) keyPerms.push('Timeout Members');
      }

      const tag         = fullUser.discriminator !== '0' ? `#${fullUser.discriminator}` : '';
      const displayName = fullUser.displayName ?? fullUser.username;
      const title       = isSelf ? 'Your Info' : `User Info — ${displayName}`;

      // ── General section text (left side) ───────────────────────────────────
      const generalLines = [
        `## ${title}`,
        '',
        '**General**',
        `Username: **${fullUser.username}${tag}**`,
        `Display name: **${displayName}**`,
        member?.nickname ? `Server nickname: **${member.nickname}**` : null,
        `User ID: \`${fullUser.id}\``,
        `Bot account: **${fullUser.bot ? 'Yes' : 'No'}**`,
        badges.length ? `Badges: ${badges.join(', ')}` : null,
      ].filter(Boolean).join('\n');

      // ── Container ──────────────────────────────────────────────────────────
      const container = new ContainerBuilder();

      // SECTION: General text on LEFT, avatar thumbnail on RIGHT
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(generalLines)
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder()
              .setURL(avatarUrl)
              .setDescription(`${fullUser.username}'s avatar`)
          )
      );

      // ── Dates ──────────────────────────────────────────────────────────────
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
      const dateLines = [
        '**Dates**',
        `Account created: ${ts(fullUser.createdAt)}`,
        member?.joinedAt     ? `Joined this server: ${ts(member.joinedAt)}`       : null,
        member?.premiumSince ? `Boosting since: ${ts(member.premiumSince)}`        : null,
      ].filter(Boolean).join('\n');
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(dateLines));

      // ── Status ─────────────────────────────────────────────────────────────
      if (member) {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        const activity = getActivity(member);
        const statusLines = [
          '**Status**',
          `Status: **${getStatus(member)}**`,
          activity ?? null,
        ].filter(Boolean).join('\n');
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusLines));
      }

      // ── Roles ──────────────────────────────────────────────────────────────
      if (roles.length) {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        const roleList = roles.slice(0, 20).map(r => `<@&${r.id}>`).join('  ');
        const extra    = roles.length > 20 ? `  ... and ${roles.length - 20} more` : '';
        const roleLines = [
          `**Roles (${roles.length})**`,
          roleList + extra,
          highestRole ? `Highest role: <@&${highestRole.id}>` : null,
        ].filter(Boolean).join('\n');
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(roleLines));
      }

      // ── Key Permissions ────────────────────────────────────────────────────
      if (keyPerms.length) {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**Key Permissions**\n${keyPerms.join('  |  ')}`
        ));
      }

      // ── Banner ─────────────────────────────────────────────────────────────
      if (bannerUrl) {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('**Profile Banner**'));
        container.addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(bannerUrl)
          )
        );
      }

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

    } catch (err) {
      console.error('[USERINFO CMD]', err);
      await interaction.editReply({ content: `> Error: ${err.message}` });
    }
  }
};
