// Qurilma imkoniyatiga qarab sahna og'irligini tanlaydi.
//
// Sabab: telefonlarning katta qismida bloom + 2 200 ta asteroid + 1024×512
// teksturalar 60 fps bermaydi. Shuning uchun yuklashdan oldin bir marta
// "past / o'rta / yuqori" daraja tanlanadi, keyin main.js kerak bo'lsa
// o'lchangan fps ga qarab bir pog'ona pastga tushiradi.
//
// Majburan tanlash: ?sifat=past | orta | yuqori  (sinash uchun qulay)

const PRESETS = {
  past: {
    tier: 'past',
    pixelRatio: 1,
    bloom: false,
    textureScale: 0.5,
    starCount: 2200,
    beltCount: 550,
    segScale: 0.6,
  },
  orta: {
    tier: 'orta',
    pixelRatio: 1.5,
    bloom: true,
    textureScale: 0.75,
    starCount: 4000,
    beltCount: 1200,
    segScale: 0.8,
  },
  yuqori: {
    tier: 'yuqori',
    pixelRatio: 2,
    bloom: true,
    textureScale: 1,
    starCount: 6500,
    beltCount: 2200,
    segScale: 1,
  },
};

const ALIASES = { low: 'past', mid: 'orta', medium: 'orta', high: 'yuqori', "o'rta": 'orta' };

function pickTier() {
  const q = new URLSearchParams(location.search).get('sifat') ?? '';
  const forced = ALIASES[q.toLowerCase()] ?? q.toLowerCase();
  if (PRESETS[forced]) return forced;

  const nav = navigator;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;          // faqat Chrome'da bor
  const coarse = matchMedia('(pointer: coarse)').matches;
  const narrow = Math.min(screen.width, screen.height) <= 820;
  const mobile = coarse && narrow;

  // Ballar: past ball = zaif qurilma
  let score = 0;
  score += cores >= 8 ? 2 : cores >= 6 ? 1 : 0;
  score += mem >= 8 ? 2 : mem >= 6 ? 1 : 0;
  score += mobile ? 0 : 2;

  if (score <= 1) return 'past';
  if (score <= 3) return 'orta';
  return 'yuqori';
}

export const QUALITY = { ...PRESETS[pickTier()] };

// Bir pog'ona pastga tushirish (fps yetmasa main.js chaqiradi).
export function lowerTier() {
  if (QUALITY.tier === 'past') return false;
  const next = QUALITY.tier === 'yuqori' ? 'orta' : 'past';
  // Tekstura o'lchami va jism sonlari allaqachon qurilgan — ularni endi
  // o'zgartirib bo'lmaydi, shuning uchun faqat kadr bahosini pasaytiramiz.
  QUALITY.tier = next;
  QUALITY.pixelRatio = PRESETS[next].pixelRatio;
  QUALITY.bloom = PRESETS[next].bloom;
  return true;
}

// Segment sonini darajaga moslash (juft son, kamida 8 ta)
export const seg = (n) => Math.max(8, Math.round((n * QUALITY.segScale) / 2) * 2);
