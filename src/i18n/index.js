// Language selection and string lookup.
//
// The scene itself never changes with language — textures, orbits and geometry
// are language-free — so switching only re-renders the HUD. That is why this
// module exposes a subscribe hook instead of forcing a page reload.
import uz from './uz.js';
import ru from './ru.js';
import en from './en.js';

// Order here is the order of the buttons in the language switcher.
export const LOCALES = [uz, ru, en];

const BY_CODE = Object.fromEntries(LOCALES.map((l) => [l.code, l]));
const FALLBACK = 'uz';
const STORAGE_KEY = 'solar.lang';

/* ---------------- Detection ---------------- */
// `?lang=ru` wins so a shared link always opens in the language it was shared
// in. `?til=` is the older Uzbek spelling of the same parameter and still works.
function fromUrl() {
  const q = new URLSearchParams(location.search);
  const raw = (q.get('lang') ?? q.get('til') ?? '').trim().toLowerCase();
  return BY_CODE[raw] ? raw : null;
}

// Private-mode browsers throw on storage access rather than returning null.
function fromStorage() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return BY_CODE[v] ? v : null;
  } catch {
    return null;
  }
}

function fromBrowser() {
  for (const tag of navigator.languages ?? [navigator.language ?? '']) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (BY_CODE[base]) return base;
  }
  return null;
}

let current = BY_CODE[fromUrl() ?? fromStorage() ?? fromBrowser() ?? FALLBACK];

/* ---------------- Reading ---------------- */
export const lang = () => current.code;
export const locale = () => current;

// `t('loaderBody', { name: 'Mars' })` — a missing key falls back to the
// reference locale, then to the key itself, so a half-translated locale still
// renders something readable instead of `undefined`.
export function t(key, vars) {
  const raw = current.ui[key] ?? BY_CODE[FALLBACK].ui[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m));
}

// Content for one body, with `kind` already resolved to a display string.
export function body(key) {
  const b = current.bodies[key] ?? BY_CODE[FALLBACK].bodies[key];
  if (!b) return null;
  return { ...b, kind: current.kinds[b.kind] ?? b.kind };
}

export const name = (key) => body(key)?.name ?? key;

/* ---------------- Writing ---------------- */
const listeners = new Set();

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setLanguage(code) {
  if (!BY_CODE[code] || code === current.code) return;
  current = BY_CODE[code];
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage blocked — the choice still applies for this page view.
  }
  for (const fn of listeners) fn(current);
}
