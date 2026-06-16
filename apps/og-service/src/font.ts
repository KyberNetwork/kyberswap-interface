// Font loading for Satori (which requires at least one real TTF/OTF). Prefers a bundled font on disk
// (FONT_DIR/WorkSans-<weight>.ttf — recommended for prod, no runtime dependency); otherwise fetches the
// weight from Google Fonts once and LRU-caches the binary. Memoized per weight.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { cache } from '@/cache';
import { FONT_DIR } from '@/config';

// Satori font name — matches the KyberSwap interface (tailwind `sans` + index.html body use Work Sans).
const FONT_FAMILY = 'Work Sans';
// Bundled file base (no space in the filename): fonts/WorkSans-<weight>.ttf.
const FONT_FILE_BASE = 'WorkSans';
const FONT_TTL_MS = 31_536_000_000; // 1 year
const FONT_FETCH_TIMEOUT_MS = 2000;

// Google Fonts serves TTF (not woff2) to legacy UAs, which is what Satori wants.
const LEGACY_UA = 'Mozilla/5.0 (Windows NT 6.1; rv:6.0) Gecko/20110814 Firefox/6.0';

const memo = new Map<number, Promise<Buffer | null>>();

async function fromDisk(weight: number): Promise<Buffer | null> {
  if (!FONT_DIR) return null;
  // Prefer a static per-weight file; fall back to a single variable font (`Inter.ttf`) used for both
  // weights (Satori applies the requested weight via the font's wght axis).
  // Inter-<weight>.ttf is the legacy bundled fallback — kept until the static Work Sans TTFs are dropped
  // into fonts/, so a build without the Work Sans files still ships a real font (no runtime Google fetch).
  for (const name of [`${FONT_FILE_BASE}-${weight}.ttf`, `Inter-${weight}.ttf`, `${FONT_FILE_BASE}.ttf`]) {
    try {
      return await readFile(join(FONT_DIR, name));
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

async function fetchGoogleFontTtf(weight: number): Promise<Buffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FONT_FAMILY)}:wght@${weight}`;
    const cssRes = await fetch(cssUrl, {
      headers: { 'User-Agent': LEGACY_UA },
      signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?truetype['"]?\)/);
    const fontUrl = match?.[1];
    // The font URL is driven by the upstream CSS body — only fetch it if it's a real gstatic URL, so
    // a tampered/compromised response can't point the secondary fetch at file:// or an internal host.
    if (!fontUrl || !fontUrl.startsWith('https://fonts.gstatic.com/')) return null;
    const fontRes = await fetch(fontUrl, { signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS) });
    if (!fontRes.ok) return null;
    return Buffer.from(await fontRes.arrayBuffer());
  } catch {
    return null;
  }
}

/** Load the card font binary for a weight (disk first, else Google Fonts). Returns null on failure. */
export function loadFont(weight: number): Promise<Buffer | null> {
  const existing = memo.get(weight);
  if (existing) return existing;

  const promise = (async () => {
    const disk = await fromDisk(weight);
    if (disk) return disk;

    const cacheKey = `font:${weight}`;
    const cached = cache.get<Buffer>(cacheKey);
    if (cached) return cached;

    const ttf = await fetchGoogleFontTtf(weight);
    if (ttf) cache.set(cacheKey, ttf, FONT_TTL_MS);
    else memo.delete(weight); // don't memoize a transient failure for the process lifetime
    return ttf;
  })();

  memo.set(weight, promise);
  return promise;
}

export { FONT_FAMILY };
