'use strict';

const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const { createBot } = require('./bot');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ANSI colour helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const C = {
  reset  : '\x1b[0m',
  bold   : '\x1b[1m',
  dim    : '\x1b[2m',

  // foreground
  white  : '\x1b[97m',
  cyan   : '\x1b[96m',
  blue   : '\x1b[94m',
  purple : '\x1b[95m',
  green  : '\x1b[92m',
  yellow : '\x1b[93m',
  red    : '\x1b[91m',
  grey   : '\x1b[90m',

  // background
  bgBlue   : '\x1b[44m',
  bgPurple : '\x1b[45m',
};

const paint = (color, str) => `${color}${str}${C.reset}`;
const bold  = (str)        => `${C.bold}${str}${C.reset}`;
const dim   = (str)        => `${C.dim}${str}${C.reset}`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ASCII BANNER  — LIXE in block letters, cyan-to-blue gradient per row
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BANNER_ROWS = [
  '  ██╗     ██╗██╗  ██╗███████╗',
  '  ██║     ██║╚██╗██╔╝██╔════╝',
  '  ██║     ██║ ╚███╔╝ █████╗  ',
  '  ██║     ██║ ██╔██╗ ██╔══╝  ',
  '  ███████╗██║██╔╝ ██╗███████╗',
  '  ╚══════╝╚═╝╚═╝  ╚═╝╚══════╝',
];

// Gradient: cyan → blue → purple per row
const ROW_COLORS = [C.cyan, C.cyan, C.blue, C.blue, C.purple, C.purple];

function printBanner() {
  console.log();
  for (let i = 0; i < BANNER_ROWS.length; i++) {
    console.log(paint(C.bold + ROW_COLORS[i], BANNER_ROWS[i]));
  }
  console.log();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INFO BOX  — system + config details
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function fmtBytes(b) {
  if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
  if (b >= 1048576)    return (b / 1048576).toFixed(1)    + ' MB';
  return (b / 1024).toFixed(1) + ' KB';
}

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

function row(label, value, labelColor = C.cyan, valueColor = C.white) {
  const L = paint(labelColor, label.padEnd(18));
  const V = paint(valueColor, String(value));
  return `  ${paint(C.grey, '│')}  ${L}  ${V}`;
}

function divider(char = '─', len = 52) {
  return `  ${paint(C.grey, '├' + char.repeat(len) + '┤')}`;
}

function topBar(len = 52) {
  return `  ${paint(C.grey, '╭' + '─'.repeat(len) + '╮')}`;
}

function botBar(len = 52) {
  return `  ${paint(C.grey, '╰' + '─'.repeat(len) + '╯')}`;
}

function sectionHeader(title, len = 52) {
  const padded = ` ${title} `;
  const sides  = Math.floor((len - padded.length) / 2);
  const line   = '─'.repeat(sides) + padded + '─'.repeat(len - sides - padded.length);
  return `  ${paint(C.grey, '├' + line + '┤')}`;
}

function printInfoBox(botsConfig, startedAt) {
  const pkg     = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
  const memUsed = process.memoryUsage().heapUsed;
  const memTotal= os.totalmem();
  const cpus    = os.cpus();
  const cpuName = cpus[0]?.model?.trim() ?? 'Unknown';
  const nodeVer = process.version;
  const pid     = process.pid;
  const platform= `${os.type()} ${os.arch()}`;
  const now     = new Date().toLocaleString('en-GB', { hour12: false });

  console.log(topBar());

  // Title row
  const title = paint(C.bold + C.cyan, 'LIXE  Music Bot') + paint(C.grey, '  v' + pkg.version);
  console.log(`  ${paint(C.grey, '│')}  ${title}`);

  console.log(sectionHeader('SYSTEM'));
  console.log(row('Node.js',    nodeVer,                 C.cyan,   C.green));
  console.log(row('Platform',   platform,                C.cyan,   C.white));
  console.log(row('CPU',        cpuName.slice(0, 34),   C.cyan,   C.white));
  console.log(row('CPU Cores',  `${cpus.length} cores`, C.cyan,   C.white));
  console.log(row('Memory',     `${fmtBytes(memUsed)} used  /  ${fmtBytes(memTotal)} total`, C.cyan, C.white));
  console.log(row('PID',        pid,                     C.cyan,   C.yellow));
  console.log(row('Started',    now,                     C.cyan,   C.white));

  console.log(sectionHeader('BOTS'));
  for (const cfg of botsConfig) {
    console.log(row('▸ ' + cfg.name,  `ID: ${cfg.clientId}`, C.purple, C.white));
  }

  console.log(sectionHeader('CONFIG'));
  console.log(row('Bots loaded',   botsConfig.length,          C.blue, C.green));
  console.log(row('Commands path', './src/commands',            C.blue, C.grey));
  console.log(row('Database',      './data.db  (SQLite)',       C.blue, C.grey));
  console.log(row('Log channel',   '1487631718059086037',       C.blue, C.cyan));
  console.log(row('Dev guild',     '1482191847366594570',       C.blue, C.cyan));

  console.log(botBar());
  console.log();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LIVE STATUS TICKER — shown after each bot logs in
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function printBotOnline(name, tag, guildCount) {
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const label = paint(C.bold + C.green,  '  ✔ ONLINE  ');
  const bname = paint(C.bold + C.purple,  name.toUpperCase());
  const btag  = paint(C.grey,  `(${tag})`);
  const meta  = paint(C.grey,  `${guildCount} guilds  ·  ${ts}`);
  console.log(`${label}  ${bname}  ${btag}  ${meta}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const botsConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'bots.json'), 'utf-8')
);

if (!botsConfig || botsConfig.length === 0) {
  console.error(paint(C.red, '[FATAL] bots.json is empty or invalid.'));
  process.exit(1);
}

const startedAt = Date.now();

// ── Print banner + info box ────────────────────────────────────────────────
printBanner();
printInfoBox(botsConfig, startedAt);

// ── Launch bots ────────────────────────────────────────────────────────────
for (const config of botsConfig) {
  if (!config.token || !config.clientId || !config.name) {
    console.warn(paint(C.yellow, `[WARN] Skipping invalid bot config: ${JSON.stringify(config)}`));
    continue;
  }

  const client = createBot(config, startedAt);

  // Hook into ready to print the live online line
  client.once('ready', () => {
    printBotOnline(config.name, client.user.tag, client.guilds.cache.size);
  });
}

// ── Unhandled rejections ───────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(paint(C.red, '[UNHANDLED REJECTION]'), err);
});
process.on('uncaughtException', (err) => {
  console.error(paint(C.red, '[UNCAUGHT EXCEPTION]'), err);
  process.exit(1);
});
