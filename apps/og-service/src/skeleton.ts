// Splice the page-shell skeleton the interface build emits (build/skeletons/<archetype>.html) into the
// served SPA shell's cold-load placeholder, so the dynamic routes og-service serves (swap/limit pair,
// pool detail) show the right page skeleton while JS loads instead of the generic logo. The fragments are
// rendered from the app's own <RouteFallback> at build time; this package can't import app code, so it
// reads them as artifacts — one source, no drift between the cold-load shape and the post-hydrate fallback.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { STATIC_DIR } from '@/config';

export type SkeletonArchetype = 'swap' | 'pool';

// The cold-load placeholder markers in the served index.html (defined in the interface's index.html).
const SKELETON_RE = /<!-- ssr-skeleton:start[\s\S]*?<!-- ssr-skeleton:end -->/;

// Memoize each fragment read (a small, fixed-per-image build artifact — same pattern as the default OG
// image). null = missing/unreadable → injectSkeleton no-ops and serves the shell's generic logo as-is.
const cache = new Map<SkeletonArchetype, Promise<string | null>>();
function loadSkeleton(archetype: SkeletonArchetype): Promise<string | null> {
  let p = cache.get(archetype);
  if (!p) {
    p = readFile(join(STATIC_DIR, 'skeletons', `${archetype}.html`), 'utf8').catch(() => null);
    cache.set(archetype, p);
  }
  return p;
}

// Swap the served shell's generic logo loader for this route's page-shell skeleton. A replacement function
// inserts the fragment verbatim ($-safe). Fail-soft: if the fragment is missing or the markers aren't
// present, return the HTML untouched — never blank the page over a cosmetic loader.
export async function injectSkeleton(html: string, archetype: SkeletonArchetype): Promise<string> {
  const fragment = await loadSkeleton(archetype);
  if (!fragment || !SKELETON_RE.test(html)) return html;
  return html.replace(
    SKELETON_RE,
    () => `<!-- ssr-skeleton:start -->\n      ${fragment}\n      <!-- ssr-skeleton:end -->`,
  );
}
