'use strict';

const { createCanvas, loadImage, registerFont } = require('canvas');

/**
 * Draw a rounded rectangle path
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generate Stats Card image
 */
async function generateStatsCard(data) {
  const W = 820, H = 440;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Top accent bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#5865F2');
  grad.addColorStop(0.5, '#eb459e');
  grad.addColorStop(1, '#5865F2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 3);

  // Card border
  roundRect(ctx, 10, 10, W - 20, H - 20, 16);
  ctx.strokeStyle = 'rgba(88,101,242,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('System Statistics', 36, 60);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '14px sans-serif';
  ctx.fillText('Radio Bot Network', 36, 82);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 100);
  ctx.lineTo(W - 36, 100);
  ctx.stroke();

  // Stats grid: 2 rows x 3 cols
  const stats = [
    { label: 'UPTIME',       value: data.uptime },
    { label: 'CPU USAGE',    value: data.cpu },
    { label: 'RAM USAGE',    value: data.ram },
    { label: 'SHARDS',       value: String(data.shards) },
    { label: 'GUILDS',       value: String(data.guilds) },
    { label: 'ACTIVE BOTS',  value: String(data.activeBots) }
  ];

  const cols = 3, rows = 2;
  const cellW = (W - 72) / cols;
  const cellH = 120;
  const startY = 120;

  stats.forEach((stat, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 36 + col * cellW;
    const y = startY + row * (cellH + 16);

    // Cell background
    roundRect(ctx, x + 4, y, cellW - 12, cellH, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();

    // Accent top border per cell
    const cg = ctx.createLinearGradient(x + 4, y, x + cellW - 8, y);
    cg.addColorStop(0, 'rgba(88,101,242,0.8)');
    cg.addColorStop(1, 'rgba(235,69,158,0.8)');
    ctx.strokeStyle = cg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 16, y);
    ctx.lineTo(x + cellW - 20, y);
    ctx.stroke();

    // Value
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(stat.value, x + 16, y + 48);

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(stat.label, x + 16, y + 72);
    ctx.letterSpacing = '0px';
  });

  // Platforms row
  const platformY = startY + rows * (cellH + 16) + 10;
  roundRect(ctx, 36, platformY, W - 72, 52, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '11px sans-serif';
  ctx.fillText('PLATFORMS', 52, platformY + 18);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(data.platforms, 52, platformY + 38);

  return canvas.toBuffer('image/png');
}

/**
 * Generate Radio List Card image
 */
async function generateRadiosCard(bots, clientId) {
  const CARD_H = 80;
  const PADDING = 20;
  const TOP = 90;
  const W = 820;
  const H = TOP + bots.length * (CARD_H + 12) + PADDING + 20;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#5865F2');
  grad.addColorStop(0.5, '#eb459e');
  grad.addColorStop(1, '#5865F2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 3);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Available Radio Stations', 36, 50);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '14px sans-serif';
  ctx.fillText(`${bots.length} station${bots.length !== 1 ? 's' : ''} online`, 36, 72);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 82);
  ctx.lineTo(W - 36, 82);
  ctx.stroke();

  // Bot cards
  bots.forEach((bot, i) => {
    const y = TOP + i * (CARD_H + 12);

    roundRect(ctx, 36, y, W - 72, CARD_H, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(88,101,242,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left accent
    roundRect(ctx, 36, y, 4, CARD_H, 2);
    const ag = ctx.createLinearGradient(0, y, 0, y + CARD_H);
    ag.addColorStop(0, '#5865F2');
    ag.addColorStop(1, '#eb459e');
    ctx.fillStyle = ag;
    ctx.fill();

    // Index badge
    roundRect(ctx, 52, y + 22, 32, 32, 8);
    ctx.fillStyle = 'rgba(88,101,242,0.25)';
    ctx.fill();
    ctx.fillStyle = '#5865F2';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`#${i + 1}`, 68, y + 44);
    ctx.textAlign = 'left';

    // Bot name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(bot.name.toUpperCase(), 100, y + 35);

    // URL preview
    const urlPreview = bot.url.length > 52 ? bot.url.slice(0, 52) + '...' : bot.url;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '12px monospace';
    ctx.fillText(urlPreview, 100, y + 55);

    // Invite link area
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${bot.clientId}&permissions=36703232&scope=bot%20applications.commands`;
    const inviteDisplay = `discord.com/oauth2/authorize?client_id=${bot.clientId}`;
    ctx.fillStyle = 'rgba(88,101,242,0.7)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(inviteDisplay, W - 52, y + 44);
    ctx.textAlign = 'left';
  });

  return canvas.toBuffer('image/png');
}

/**
 * Format milliseconds to m:ss
 */
function fmtDuration(ms) {
  if (!ms || ms <= 0) return 'LIVE';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Truncate text to fit within maxWidth pixels
 */
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

/**
 * Generate Now Playing card
 * data: { title, author, duration, botName, channelName, requester, queueSize, volume }
 */
async function generateNowPlayingCard(data) {
  const W = 900, H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Background ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#0d0d18';
  ctx.fillRect(0, 0, W, H);

  // Subtle dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let x = 20; x < W; x += 30) {
    for (let y = 20; y < H; y += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top gradient bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, '#5865F2');
  topBar.addColorStop(0.5, '#eb459e');
  topBar.addColorStop(1, '#5865F2');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 4);

  // ── Art panel (left) ─────────────────────────────────────────────────────
  const ART_X = 28, ART_Y = 28, ART_S = 224;

  // Clip region for art (rounded square)
  roundRect(ctx, ART_X, ART_Y, ART_S, ART_S, 16);
  ctx.save();
  ctx.clip();

  let thumbnailLoaded = false;
  if (data.thumbnailUrl) {
    try {
      const img = await loadImage(data.thumbnailUrl);
      // Cover-fit: scale so the image fills the square, centered
      const scale = Math.max(ART_S / img.width, ART_S / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = ART_X + (ART_S - dw) / 2;
      const dy = ART_Y + (ART_S - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      // Subtle dark overlay so it doesn't look too bright against the card
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(ART_X, ART_Y, ART_S, ART_S);
      thumbnailLoaded = true;
    } catch (_) {
      // fall through to gradient
    }
  }

  if (!thumbnailLoaded) {
    // Fallback gradient
    const artGrad = ctx.createLinearGradient(ART_X, ART_Y, ART_X + ART_S, ART_Y + ART_S);
    artGrad.addColorStop(0, '#1e1b4b');
    artGrad.addColorStop(0.5, '#2d1b69');
    artGrad.addColorStop(1, '#1a1035');
    ctx.fillStyle = artGrad;
    ctx.fillRect(ART_X, ART_Y, ART_S, ART_S);

    // Waveform bars
    const barsCount = 18;
    const bW = 7, bGap = 5;
    const bTotalW = barsCount * (bW + bGap) - bGap;
    const bStartX = ART_X + (ART_S - bTotalW) / 2;
    const bCenterY = ART_Y + ART_S / 2 + 20;
    const maxBH = 56;
    for (let b = 0; b < barsCount; b++) {
      const t = b / (barsCount - 1);
      const h = maxBH * (0.25 + 0.75 * Math.sin(Math.PI * t));
      const bx = bStartX + b * (bW + bGap);
      const alpha = 0.5 + 0.5 * Math.sin(Math.PI * t);
      const barGrad = ctx.createLinearGradient(bx, bCenterY - h, bx, bCenterY + h);
      barGrad.addColorStop(0, `rgba(235,69,158,${alpha})`);
      barGrad.addColorStop(0.5, `rgba(88,101,242,${alpha})`);
      barGrad.addColorStop(1, `rgba(235,69,158,${alpha})`);
      roundRect(ctx, bx, bCenterY - h, bW, h * 2, 3);
      ctx.fillStyle = barGrad;
      ctx.fill();
    }

    // Music note
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♪', ART_X + ART_S / 2, ART_Y + ART_S / 2 - 12);
    ctx.textAlign = 'left';
  }

  ctx.restore();

  // Art border (drawn on top of image/gradient)
  roundRect(ctx, ART_X, ART_Y, ART_S, ART_S, 16);
  const artBorder = ctx.createLinearGradient(ART_X, ART_Y, ART_X + ART_S, ART_Y + ART_S);
  artBorder.addColorStop(0, 'rgba(88,101,242,0.7)');
  artBorder.addColorStop(1, 'rgba(235,69,158,0.7)');
  ctx.strokeStyle = artBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Right panel ──────────────────────────────────────────────────────────
  const RX = ART_X + ART_S + 28;
  const RW = W - RX - 24;

  // Bot name badge
  const badgeLabel = (data.botName || 'BEATS').toUpperCase();
  ctx.font = 'bold 11px sans-serif';
  const badgeW = ctx.measureText(badgeLabel).width + 20;
  roundRect(ctx, RX, 34, badgeW, 22, 6);
  const badgeGrad = ctx.createLinearGradient(RX, 0, RX + badgeW, 0);
  badgeGrad.addColorStop(0, 'rgba(88,101,242,0.3)');
  badgeGrad.addColorStop(1, 'rgba(235,69,158,0.3)');
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  roundRect(ctx, RX, 34, badgeW, 22, 6);
  ctx.strokeStyle = 'rgba(88,101,242,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(badgeLabel, RX + 10, 49);

  // NOW PLAYING label
  ctx.fillStyle = '#57f287';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('▶  NOW PLAYING', RX + badgeW + 14, 49);

  // Track title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  const titleText = truncateText(ctx, data.title || 'Unknown Track', RW);
  ctx.fillText(titleText, RX, 96);

  // Author
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '16px sans-serif';
  const authorText = truncateText(ctx, data.author || 'Unknown Artist', RW);
  ctx.fillText(authorText, RX, 122);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RX, 136);
  ctx.lineTo(RX + RW, 136);
  ctx.stroke();

  // Progress bar track
  const PBY = 152, PBH = 6, PBW = RW;
  roundRect(ctx, RX, PBY, PBW, PBH, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();

  // Progress fill — always show a short filled segment as visual flair
  const fillRatio = 0.05;
  const fillW = Math.max(PBH, PBW * fillRatio);
  const pgGrad = ctx.createLinearGradient(RX, 0, RX + fillW, 0);
  pgGrad.addColorStop(0, '#5865F2');
  pgGrad.addColorStop(1, '#eb459e');
  roundRect(ctx, RX, PBY, fillW, PBH, 3);
  ctx.fillStyle = pgGrad;
  ctx.fill();

  // Progress dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(RX + fillW, PBY + PBH / 2, 6, 0, Math.PI * 2);
  ctx.fill();

  // Timestamps
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '12px monospace';
  ctx.fillText('0:00', RX, PBY + PBH + 18);
  const durLabel = fmtDuration(data.duration);
  ctx.textAlign = 'right';
  ctx.fillText(durLabel, RX + RW, PBY + PBH + 18);
  ctx.textAlign = 'left';

  // Info chips row
  const chipY = PBY + PBH + 44;
  const chips = [
    { icon: '🔊', text: `#${data.channelName || '?'}` },
    { icon: '👤', text: data.requester || '?' },
    { icon: '📋', text: `${data.queueSize > 0 ? data.queueSize + ' in queue' : 'Last track'}` },
    { icon: '🎚️', text: `Vol ${data.volume ?? 200}%` }
  ];

  let chipCursor = RX;
  ctx.font = '13px sans-serif';
  for (const chip of chips) {
    const chipText = `${chip.icon} ${chip.text}`;
    const cW = ctx.measureText(chipText).width + 18;
    if (chipCursor + cW > RX + RW) break;
    roundRect(ctx, chipCursor, chipY - 14, cW, 22, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(chipText, chipCursor + 9, chipY + 4);
    chipCursor += cW + 8;
  }

  return canvas.toBuffer('image/png');
}

module.exports = { generateStatsCard, generateRadiosCard, generateNowPlayingCard };
