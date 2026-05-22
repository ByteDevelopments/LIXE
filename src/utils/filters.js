'use strict';

// ── Base HQ EQ (applied on every player create) ───────────────────────────────
const HQ_EQ = [
  { band: 0,  gain:  0.06 },
  { band: 1,  gain:  0.14 },
  { band: 2,  gain:  0.13 },
  { band: 3,  gain:  0.10 },
  { band: 4,  gain:  0.06 },
  { band: 5,  gain:  0.02 },
  { band: 6,  gain: -0.02 },
  { band: 7,  gain: -0.04 },
  { band: 8,  gain: -0.04 },
  { band: 9,  gain: -0.01 },
  { band: 10, gain:  0.02 },
  { band: 11, gain:  0.04 },
  { band: 12, gain:  0.06 },
  { band: 13, gain:  0.08 },
  { band: 14, gain:  0.06 },
];

const HQ_TIMESCALE  = { speed: 1.0, pitch: 1.0, rate: 1.0 };
const HQ_CHANNEL_MIX = { leftToLeft: 1.0, rightToRight: 1.0, leftToRight: 0.0, rightToLeft: 0.0 };

async function applyQualityFilters(player) {
  try {
    const s = player.shoukaku;
    if (!s) return;
    await s.setEqualizer(HQ_EQ);
    await s.setFilterVolume(2.0);
    await s.setTimescale(HQ_TIMESCALE);
    await s.setChannelMix(HQ_CHANNEL_MIX);
    await s.setLowPass(null);
    console.log(`[HQ] Filters applied — guild ${player.guildId}`);
  } catch (err) {
    console.error('[HQ] Failed to apply filters:', err.message);
  }
}

// ── Named filter presets ──────────────────────────────────────────────────────

const FILTERS = {
  bassboost: async (player) => {
    const s = player.shoukaku;
    await s.setEqualizer([
      { band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.20 },
      { band: 3, gain: 0.15 }, { band: 4, gain: 0.10 }, { band: 5, gain: 0.05 },
      { band: 6, gain: 0.00 }, { band: 7, gain: 0.00 }, { band: 8, gain: 0.00 },
      { band: 9, gain: 0.00 }, { band: 10, gain: 0.00 }, { band: 11, gain: 0.00 },
      { band: 12, gain: 0.00 }, { band: 13, gain: 0.00 }, { band: 14, gain: 0.00 },
    ]);
    await s.setTimescale({ speed: 1.0, pitch: 1.0, rate: 1.0 });
    await s.setLowPass(null);
  },

  lofi: async (player) => {
    const s = player.shoukaku;
    await s.setEqualizer(HQ_EQ);
    await s.setTimescale({ speed: 0.85, pitch: 0.90, rate: 1.0 });
    await s.setLowPass({ smoothing: 20 });
  },

  slowreverb: async (player) => {
    const s = player.shoukaku;
    await s.setEqualizer(HQ_EQ);
    await s.setTimescale({ speed: 0.80, pitch: 0.92, rate: 0.95 });
    await s.setLowPass({ smoothing: 10 });
  },

  nightcore: async (player) => {
    const s = player.shoukaku;
    await s.setEqualizer(HQ_EQ);
    await s.setTimescale({ speed: 1.15, pitch: 1.25, rate: 1.0 });
    await s.setLowPass(null);
  },

  lowpass: async (player) => {
    const s = player.shoukaku;
    await s.setEqualizer(HQ_EQ);
    await s.setTimescale(HQ_TIMESCALE);
    await s.setLowPass({ smoothing: 40 });
  },

  highpass: async (player) => {
    const s = player.shoukaku;
    // Cut lows, boost highs
    await s.setEqualizer([
      { band: 0, gain: -0.25 }, { band: 1, gain: -0.25 }, { band: 2, gain: -0.20 },
      { band: 3, gain: -0.10 }, { band: 4, gain: -0.05 }, { band: 5, gain:  0.00 },
      { band: 6, gain:  0.02 }, { band: 7, gain:  0.04 }, { band: 8, gain:  0.06 },
      { band: 9, gain:  0.08 }, { band: 10, gain: 0.10 }, { band: 11, gain: 0.12 },
      { band: 12, gain: 0.14 }, { band: 13, gain: 0.16 }, { band: 14, gain: 0.18 },
    ]);
    await s.setTimescale(HQ_TIMESCALE);
    await s.setLowPass(null);
  },

  reset: async (player) => {
    await applyQualityFilters(player);
  }
};

// Human-readable labels and descriptions
const FILTER_INFO = {
  bassboost:  { label: 'Bass Boost',       description: 'Heavy sub-bass and bass boost across low frequencies' },
  lofi:       { label: 'Lo-Fi',            description: 'Slowed, warm, muffled — classic lo-fi aesthetic' },
  slowreverb: { label: 'Slow + Reverb',    description: 'Slowed down with reverb-style timescale effect' },
  nightcore:  { label: 'Nightcore',        description: 'Sped up with raised pitch — nightcore style' },
  lowpass:    { label: 'Low Pass',         description: 'Cuts high frequencies — warm, muffled sound' },
  highpass:   { label: 'High Pass',        description: 'Cuts low frequencies — bright, crisp sound' },
  reset:      { label: 'Reset (HQ)',       description: 'Remove all filters and restore HQ audio preset' },
};

module.exports = { applyQualityFilters, HQ_EQ, FILTERS, FILTER_INFO };
