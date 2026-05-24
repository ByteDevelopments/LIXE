<div align="center">

```
  ██╗     ██╗██╗  ██╗███████╗
  ██║     ██║╚██╗██╔╝██╔════╝
  ██║     ██║ ╚███╔╝ █████╗  
  ██║     ██║ ██╔██╗ ██╔══╝  
  ███████╗██║██╔╝ ██╗███████╗
  ╚══════╝╚═╝╚═╝  ╚═╝╚══════╝
```

# LIXE — Discord Music Bot

**A powerful, multi-instance Discord music bot powered by Lavalink & Kazagumo**  
Stream from 20+ platforms with audio filters, queue management, 24/7 mode, and rich Now Playing cards.

---

[![Version](https://img.shields.io/badge/version-2.0.0-7c3aed?style=for-the-badge&logo=semver&logoColor=white)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Lavalink](https://img.shields.io/badge/Lavalink-Kazagumo-ff6b6b?style=for-the-badge&logo=soundcloud&logoColor=white)](https://github.com/Eyenine/Kazagumo)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Organization](https://img.shields.io/badge/org-ByteDevelopments-0ea5e9?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ByteDevelopments)

---

**Organization:** [ByteDevelopments](https://github.com/ByteDevelopments) &nbsp;•&nbsp; **Author:** [ALLAY_XD_20](https://github.com/ALLAY-XD-20) &nbsp;•&nbsp; **Discord:** `allay_gaming_x`

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🌐 Supported Platforms](#-supported-platforms)
- [📁 Project Structure](#-project-structure)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [▶️ Running the Bot](#️-running-the-bot)
- [📋 Commands](#-commands)
- [🎛️ Audio Filters](#️-audio-filters)
- [🗄️ Database](#️-database)
- [🤝 Contributing](#-contributing)
- [👤 Author](#-author)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎵 **Multi-Platform Playback** | Stream from 20+ platforms including YouTube, Spotify, Apple Music, SoundCloud and more |
| 🤖 **Multi-Instance** | Run multiple bot instances from a single process via `bots.json` |
| 🎶 **Now Playing Card** | Live-updating now-playing embed with inline Pause / Skip controls |
| 🔂 **Queue Management** | Full queue with skip, previous, seek, loop (track/queue), and autoplay |
| 🎛️ **Audio Filters** | Bass Boost, Lo-Fi, Slow+Reverb, Nightcore, Low Pass, High Pass, and HQ Reset |
| 🕐 **24/7 Mode** | Keep the bot in a voice channel permanently per server |
| 🚫 **Channel Ignore** | Ignore specific channels for command processing per guild |
| 📊 **System Stats** | Real-time stats: CPU, memory, Lavalink node info, shard status |
| 🔒 **Owner Commands** | Restart, reconnect, and customize bot avatar/banner — restricted to bot owner |
| 🗃️ **SQLite Persistence** | Guild settings and ignored channels are stored in a local SQLite database |
| 📟 **Rich Console** | Colour-coded ANSI banner, system info box, and live online indicator on startup |

---

## 🌐 Supported Platforms

<div align="center">

| Category | Platforms |
|---|---|
| 🎧 **Streaming** | YouTube · Spotify · SoundCloud · Apple Music · Deezer · Tidal · Qobuz · Yandex Music |
| 📱 **Social** | TikTok · Reddit · Instagram · Twitch · Vimeo · Mixcloud |
| 🌏 **Regional** | JioSaavn · Bandcamp · Soundgasm · GetYarn · Clypit · OC ReMix |
| 🔗 **Direct** | Local files · HTTP/HTTPS URLs |

</div>

> **Note:** Spotify, Apple Music, Deezer, Yandex Music, Tidal, and Qobuz require a Lavalink instance with the **LavaSrc** plugin installed.

---

## 📁 Project Structure

```
LIXE/
├── src/
│   ├── index.js              # Entry point — launches all bot instances
│   ├── bot.js                # Bot factory (Discord client, Kazagumo, event handlers)
│   ├── commands/
│   │   ├── play.js           # /play — multi-platform playback
│   │   ├── search.js         # /search — interactive track search
│   │   ├── pause.js          # /pause
│   │   ├── resume.js         # /resume
│   │   ├── stop.js           # /stop
│   │   ├── skip.js           # /skip [amount]
│   │   ├── previous.js       # /previous
│   │   ├── seek.js           # /seek <time>
│   │   ├── replay.js         # /replay
│   │   ├── loop.js           # /loop <mode>
│   │   ├── volume.js         # /volume <50-200>
│   │   ├── queue.js          # /queue [page]
│   │   ├── nowplaying.js     # /nowplaying
│   │   ├── autoplay.js       # /autoplay toggle
│   │   ├── join.js           # /join
│   │   ├── disconnect.js     # /disconnect
│   │   ├── filter.js         # /filter <preset>
│   │   ├── 247.js            # /247 toggle
│   │   ├── ignore.js         # /ignore <channel>
│   │   ├── ping.js           # /ping
│   │   ├── stats.js          # /stats
│   │   ├── node.js           # /node
│   │   ├── userinfo.js       # /userinfo [user]
│   │   ├── support.js        # /support
│   │   ├── help.js           # /help
│   │   ├── restart.js        # /restart  [owner only]
│   │   ├── reconnect.js      # /reconnect [owner only]
│   │   └── customize.js      # /customize [owner only]
│   └── utils/
│       ├── canvas.js         # Now Playing card image generation
│       ├── db.js             # SQLite helpers (guild settings, ignored channels)
│       ├── filters.js        # Audio filter presets & quality defaults
│       ├── logger.js         # Shard + Lavalink event logger
│       ├── nowplaying.js     # Live NP session management
│       └── stats.js          # System stats helpers
├── bots.json                 # Bot token(s) and config (see Configuration)
├── db.sql                    # Database schema
├── data.db                   # SQLite database (auto-created)
└── package.json
```

---

## ⚙️ Prerequisites

Before running LIXE, make sure you have:

- **[Node.js](https://nodejs.org) v18 or newer**
- **[Lavalink](https://github.com/lavalink-devs/Lavalink) server** (v4 recommended) — running and accessible
- A **Discord Bot Token** from the [Discord Developer Portal](https://discord.com/developers/applications)

> 💡 For Spotify, Apple Music, Deezer and other premium sources, your Lavalink instance must have the **[LavaSrc plugin](https://github.com/topi314/LavaSrc)** enabled.

---

## 🚀 Installation

```bash
# 1. Clone the repository
git clone https://github.com/ByteDevelopments/LIXE.git
cd LIXE

# 2. Install dependencies
npm install

# 3. Set up your configuration (see below)
cp bots.json.example bots.json
```

---

## 🔧 Configuration

Edit **`bots.json`** in the root directory. You can add one or more bot instances:

```json
[
  {
    "name":            "LIXE",
    "token":           "YOUR_BOT_TOKEN_HERE",
    "clientId":        "YOUR_CLIENT_ID_HERE",
    "supportServerId": "YOUR_SUPPORT_SERVER_ID",
    "supportInvite":   "https://discord.gg/your-invite"
  }
]
```

| Field | Description |
|---|---|
| `name` | Display name for console logs |
| `token` | Discord bot token (keep this secret!) |
| `clientId` | Application/Client ID from Discord Developer Portal |
| `supportServerId` | Guild ID of your support server (used for slash command registration) |
| `supportInvite` | Invite link shown in `/support` and the `/help` button |

### Lavalink Node

The Lavalink node is configured in **`src/bot.js`** under `LAVALINK_NODES`:

```js
const LAVALINK_NODES = [
  {
    name:   'main',
    url:    'your-lavalink-host:port',
    auth:   'your-lavalink-password',
    secure: false   // set to true for WSS / HTTPS
  }
];
```

> ⚠️ **Never commit your bot token or Lavalink credentials to a public repository.** Use environment variables or a `.env` file in production.

---

## ▶️ Running the Bot

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

On startup you will see a coloured ANSI banner followed by a system info box showing Node.js version, platform, CPU, memory, PID, and the loaded bot configurations. Each bot prints a `✔ ONLINE` line when it successfully connects to Discord.

---

## 📋 Commands

### 🎵 Music Playback

| Command | Description |
|---|---|
| `/play <query>` | Play from a URL or search term (auto-detects platform) |
| `/search <query>` | Search and pick a track interactively |
| `/pause` | Pause the current track |
| `/resume` | Resume a paused track |
| `/stop` | Stop playback and clear the queue |
| `/replay` | Restart the current track from the beginning |
| `/volume <50–200>` | Adjust the playback volume |
| `/join` | Join your current voice channel |
| `/disconnect` | Disconnect the bot from voice |

### 📋 Queue Management

| Command | Description |
|---|---|
| `/queue [page]` | Browse the current queue |
| `/skip [amount]` | Skip one or more tracks forward |
| `/previous` | Go back to the previous track |
| `/seek <time>` | Jump to a position, e.g. `1:30` |
| `/loop <mode>` | Loop: `track` · `queue` · `off` |
| `/autoplay` | Toggle auto-queue of related tracks |
| `/nowplaying` | Show the live Now Playing card |

### ⚙️ Server Config

| Command | Description |
|---|---|
| `/247` | Toggle 24/7 mode — bot stays in voice permanently |
| `/ignore` | Ignore / un-ignore a channel for bot commands |

### 📊 Info & Utility

| Command | Description |
|---|---|
| `/ping` | Show bot & API latency |
| `/stats` | Full system stats (bot · shards · Lavalink) |
| `/node` | Lavalink node details |
| `/userinfo [user]` | Info about any server member |
| `/support` | Get the support server link |
| `/help` | Show the full command reference |

### 🔐 Owner Commands *(restricted)*

| Command | Description |
|---|---|
| `/restart` | Gracefully restart all bot instances |
| `/reconnect` | Reconnect all shards + Lavalink nodes |
| `/customize pfp:<url> banner:<url>` | Change bot avatar and banner |

---

## 🎛️ Audio Filters

Apply filters with `/filter preset:<name>`:

| Preset | Effect |
|---|---|
| 🎸 **Bass Boost** | Heavy bass enhancement via equalizer |
| ☁️ **Lo-Fi** | Warm, slowed lo-fi vibes |
| 🌊 **Slow + Reverb** | Slowed with reverb timescale |
| ⚡ **Nightcore** | Sped-up with higher pitch |
| 🔉 **Low Pass** | Cuts high frequencies |
| 🔈 **High Pass** | Cuts low frequencies |
| ♻️ **Reset (HQ)** | Remove all filters and restore high-quality audio |

---

## 🗄️ Database

LIXE uses a **SQLite** database (`data.db`) for persistent guild settings.  
The schema is defined in `db.sql`:

```sql
-- Per-guild 24/7 settings and voice/text channel binding
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id   TEXT NOT NULL,
  client_id  TEXT NOT NULL,
  voice_id   TEXT,
  text_id    TEXT,
  enabled    INTEGER DEFAULT 1,
  updated_at TEXT,
  PRIMARY KEY (guild_id, client_id)
);

-- Channels the bot should ignore for command processing
CREATE TABLE IF NOT EXISTS ignored_channels (
  guild_id   TEXT NOT NULL,
  client_id  TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  PRIMARY KEY (guild_id, client_id, channel_id)
);
```

The database file is created automatically on first run. No manual setup is required.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow the existing code style and keep all bot tokens out of commits.

---

## 👤 Author

<div align="center">

**ALLAY_XD_20**

[![Discord](https://img.shields.io/badge/Discord-allay__gaming__x-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/allay_gaming_x)
[![GitHub](https://img.shields.io/badge/GitHub-ALLAY--XD--20-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ALLAY-XD-20)
[![Organization](https://img.shields.io/badge/Org-ByteDevelopments-0ea5e9?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ByteDevelopments)

*Built with 💜 by ByteDevelopments*

</div>

---

<div align="center">

<sub>© 2026 ByteDevelopments · Released under the MIT License</sub>

# 💖 DONATE FOR SUPPORT

<p align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" width="120" alt="Donate">
</p>

<p align="center">
  Support this project by donating using any of the wallets below 🚀
</p>

---

## 💸 Payment Methods

### 🏦 UPI
<p align="left">
  <img src="https://img.icons8.com/color/96/bhim.png" width="40"/>
</p>


Pawan-ok@fam


---

🪙 Litecoin (LTC)

<p align="left">
  <img src="https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=032" width="40"/>
</p>LgKc1NhBS6J7J8Eh8YQkLpcz2rMasWnbD3


---

₿ Bitcoin (BTC)

<p align="left">
  <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=032" width="40"/>
</p>bc1qqu95jhnd27awgaygn4pjlr4vqrxawsph9npyn4


---

☀️ Solana (SOL)

<p align="left">
  <img src="https://cryptologos.cc/logos/solana-sol-logo.png?v=032" width="40"/>
</p>8S4q4L142kkvZAxokXBUxFqXzFrZWq2NTd69xVsJZ2RJ


---

🌟 Thank You For Your Support

<p align="center">
  <img src="https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif" width="250"/>
</p><p align="center">
  Your support helps keep this project alive ❤️
</p>

</div>
