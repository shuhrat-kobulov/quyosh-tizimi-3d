// Picks how heavy the scene may be, based on what the device can handle.
//
// Why: on most phones bloom plus 2,200 asteroids plus 1024x512 textures will
// not hold 60 fps. So a "low / medium / high" tier is chosen once before
// loading, and main.js drops it one step later if the measured fps falls short.
//
// Force a tier for testing: ?quality=low | medium | high

const PRESETS = {
  low: {
    tier: 'low',
    pixelRatio: 1,
    bloom: false,
    textureScale: 0.5,
    starCount: 2200,
    beltCount: 550,
    segScale: 0.6,
  },
  medium: {
    tier: 'medium',
    pixelRatio: 1.5,
    bloom: true,
    textureScale: 0.75,
    starCount: 4000,
    beltCount: 1200,
    segScale: 0.8,
  },
  high: {
    tier: 'high',
    pixelRatio: 2,
    bloom: true,
    textureScale: 1,
    starCount: 6500,
    beltCount: 2200,
    segScale: 1,
  },
};

// `past`, `orta` and `yuqori` are the Uzbek tier names this project used before
// the codebase moved to English; links using them still work.
const ALIASES = {
  mid: 'medium',
  past: 'low', orta: 'medium', "o'rta": 'medium', yuqori: 'high',
};

function pickTier() {
  const q = new URLSearchParams(location.search);
  const raw = (q.get('quality') ?? q.get('sifat') ?? '').trim().toLowerCase();
  const forced = ALIASES[raw] ?? raw;
  if (PRESETS[forced]) return forced;

  const nav = navigator;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;          // Chrome only
  const coarse = matchMedia('(pointer: coarse)').matches;
  const narrow = Math.min(screen.width, screen.height) <= 820;
  const mobile = coarse && narrow;

  // Score: a low score means a weak device
  let score = 0;
  score += cores >= 8 ? 2 : cores >= 6 ? 1 : 0;
  score += mem >= 8 ? 2 : mem >= 6 ? 1 : 0;
  score += mobile ? 0 : 2;

  if (score <= 1) return 'low';
  if (score <= 3) return 'medium';
  return 'high';
}

export const QUALITY = { ...PRESETS[pickTier()] };

// Drop one step (called by main.js when the frame rate falls short).
export function lowerTier() {
  if (QUALITY.tier === 'low') return false;
  const next = QUALITY.tier === 'high' ? 'medium' : 'low';
  // Texture sizes and object counts are already built and cannot be changed
  // now, so only the per-frame cost comes down.
  QUALITY.tier = next;
  QUALITY.pixelRatio = PRESETS[next].pixelRatio;
  QUALITY.bloom = PRESETS[next].bloom;
  return true;
}

// Fits a segment count to the tier (even number, at least 8).
export const seg = (n) => Math.max(8, Math.round((n * QUALITY.segScale) / 2) * 2);
